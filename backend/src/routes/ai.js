import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// 1. AI Smart Suggest — axtarış sahəsində yazarkən təklif
router.get('/suggest', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json({ suggestions: [] });

    // PG trigram + popular searches
    const rs = await pool.query(`
      SELECT title, views
      FROM listings
      WHERE status='published'
        AND (title ILIKE $1 OR title %> $2)
      ORDER BY views DESC, similarity(title, $2) DESC
      LIMIT 8
    `, [`%${q}%`, q]);

    // Açar söz təkrarlaması
    const titles = rs.rows.map(r => r.title);
    const words = new Set();
    titles.forEach(t => {
      t.split(/\s+/).slice(0, 4).forEach(w => {
        if (w.length > 2 && w.toLowerCase().includes(q.toLowerCase())) words.add(w);
      });
    });

    res.json({
      suggestions: titles.slice(0, 5),
      keywords: Array.from(words).slice(0, 5),
    });
  } catch (e) { next(e); }
});

// 2. AI Categorize from photo (mock — real-da OpenAI Vision)
const PHOTO_HINTS = [
  { kw: ['phone','iphone','samsung','galaxy','telefon'], cat: 'telefon', name: 'Telefon' },
  { kw: ['laptop','notebook','macbook','noutbuk'], cat: 'noutbuk', name: 'Noutbuk' },
  { kw: ['car','auto','bmw','mercedes','toyota','avtomobil'], cat: 'avtomobil', name: 'Avtomobil' },
  { kw: ['watch','saat','rolex'], cat: 'saat', name: 'Saat' },
  { kw: ['shoe','ayaqqabi','nike','adidas'], cat: 'ayaqqabi', name: 'Ayaqqabı' },
];
router.post('/categorize', (req, res) => {
  const { filename = '', size = 0 } = req.body;
  const lower = filename.toLowerCase();
  let suggestion = null;
  for (const h of PHOTO_HINTS) {
    if (h.kw.some(k => lower.includes(k))) {
      suggestion = { category: h.cat, name: h.name, confidence: 0.85 };
      break;
    }
  }
  if (!suggestion) {
    suggestion = { category: null, name: null, confidence: 0, hint: 'Şəkildən kateqoriya təyin edilə bilmədi' };
  }
  res.json(suggestion);
});

// 3. AI Summarize — uzun təsviri 3 bullet-ə qısalt
router.post('/summarize', (req, res) => {
  const { text = '' } = req.body;
  if (!text || text.length < 50) {
    return res.json({ bullets: [], short: text });
  }
  // Sentence split + score by keyword frequency
  const sentences = text.split(/[.!?]\s+/).filter(s => s.trim().length > 10);
  const wordFreq = {};
  text.toLowerCase().split(/\s+/).forEach(w => {
    if (w.length > 4) wordFreq[w] = (wordFreq[w] || 0) + 1;
  });
  const scored = sentences.map(s => {
    const sc = s.toLowerCase().split(/\s+/).reduce((a, w) => a + (wordFreq[w] || 0), 0);
    return { s, sc };
  }).sort((a, b) => b.sc - a.sc);
  const bullets = scored.slice(0, 3).map(x => x.s.trim().slice(0, 120));
  res.json({ bullets, short: bullets.join(' • ') });
});

// 4. AI Translate (mock — sadə dictionary və göstərici)
const TRANSLATE_DICT = {
  'satılır': { ru: 'продается', en: 'for sale' },
  'kirayə': { ru: 'аренда', en: 'rent' },
  'yeni': { ru: 'новый', en: 'new' },
  'işlənmiş': { ru: 'б/у', en: 'used' },
  'mənzil': { ru: 'квартира', en: 'apartment' },
  'avtomobil': { ru: 'автомобиль', en: 'car' },
  'telefon': { ru: 'телефон', en: 'phone' },
  'manat': { ru: 'манат', en: 'AZN' },
  'çatdırılma': { ru: 'доставка', en: 'delivery' },
  'kredit': { ru: 'кредит', en: 'credit' },
  'barter': { ru: 'обмен', en: 'barter' },
};
router.post('/translate', (req, res) => {
  const { text = '', target = 'ru' } = req.body;
  let translated = text;
  for (const [az, t] of Object.entries(TRANSLATE_DICT)) {
    if (t[target]) {
      translated = translated.replace(new RegExp(az, 'gi'), t[target]);
    }
  }
  res.json({
    original: text,
    translated,
    target,
    note: 'Demo tərcümə — daha geniş model üçün API açarı tələb olunur',
  });
});

// 5. AI Fraud / Quality Score — elan üçün risk + keyfiyyət
router.post('/fraud-score', async (req, res, next) => {
  try {
    const { title = '', description = '', price = 0, category = '', media = [] } = req.body;

    let score = 100;
    const flags = [];

    // Çox aşağı qiymət (median-dən 50% az)
    if (category && price > 0) {
      const avg = await pool.query(
        `SELECT AVG(l.price) AS m
         FROM listings l JOIN categories c ON c.id = l.category_id
         WHERE c.slug=$1 AND l.status='published' AND l.price>0`,
        [category]
      );
      const median = Number(avg.rows[0]?.m || 0);
      if (median > 0 && price < median * 0.4) {
        score -= 30;
        flags.push({ type: 'price', text: `Qiymət bazar ortasından (${Math.round(median)}₼) çox aşağıdır — fırıldaq ola bilər` });
      }
    }
    // Şəkil yoxdur
    if (!media || media.length === 0) {
      score -= 15;
      flags.push({ type: 'media', text: 'Şəkil əlavə olunmayıb' });
    }
    // Təsvir çox qısa
    if (description.length < 50) {
      score -= 10;
      flags.push({ type: 'desc', text: 'Təsvir çox qısadır (min 50 simvol tövsiyə edilir)' });
    }
    // Hamı böyük hərf
    if (title.length > 5 && title === title.toUpperCase()) {
      score -= 5;
      flags.push({ type: 'title', text: 'Başlıq tamamilə böyük hərflərlədir' });
    }
    // Bahalı söz
    const suspicious = ['təcili', 'ucuz', 'gözəl təklif', 'fürsət', 'whatsapp +'];
    suspicious.forEach(w => {
      if (title.toLowerCase().includes(w) || description.toLowerCase().includes(w)) {
        score -= 3;
      }
    });

    score = Math.max(0, Math.min(100, score));
    const level = score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low';
    res.json({
      score,
      level,
      flags,
      label: level === 'high' ? 'Yüksək keyfiyyət' : level === 'medium' ? 'Orta keyfiyyət' : 'Aşağı keyfiyyət — diqqətli olun',
    });
  } catch (e) { next(e); }
});

// 6. AI Smart Reply — chat-da cavab təklifləri
router.post('/smart-reply', (req, res) => {
  const { lastMessage = '', context = 'buyer' } = req.body;
  const lm = lastMessage.toLowerCase();

  const replies = [];
  if (context === 'seller') {
    if (/qiymət|ne qədər|nə qədər|cost/.test(lm)) {
      replies.push('Qiymət ev hesabıdır, razılaşa bilərik.', 'Şəxsiyyət göstərilən kimi son qiymət deyə bilərəm.');
    } else if (/var|mövcud|hazır/.test(lm)) {
      replies.push('Bəli, mövcuddur. Görüşə bilərik.', 'Hələ də satışda saxlanılır, sürətlə cavab yazın.');
    } else if (/şəkil|şekil|fotka/.test(lm)) {
      replies.push('Daha əlavə şəkillər göndərirəm bir az sonra.', 'Hansı bucaqdan istəyirsiniz şəkli?');
    } else {
      replies.push('Salam, dinləyirəm.', 'Sual versəniz cavab yazaram.');
    }
  } else {
    replies.push('Hələ də mövcuddur?', 'Son qiymət nədir?', 'Görüşə bilərik mi?', 'Çatdırılma var?');
  }
  res.json({ replies: replies.slice(0, 4) });
});

// 7. AI Similar listings — ML-bənzər məzmun (trigram + kateqoriya + qiymət bandı)
router.get('/similar/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const r = await pool.query(`SELECT title, category_id, price, currency FROM listings WHERE id=$1`, [id]);
    if (r.rowCount === 0) return res.json({ items: [] });
    const ref = r.rows[0];
    const minP = Number(ref.price) * 0.7;
    const maxP = Number(ref.price) * 1.3;

    const sim = await pool.query(`
      SELECT l.id, l.title, l.price, l.currency, l.created_at,
        (SELECT json_build_object('url', m.url) FROM listing_media m WHERE m.listing_id=l.id ORDER BY m.position LIMIT 1) AS cover
      FROM listings l
      WHERE l.id != $1 AND l.status='published' AND l.category_id=$2
        AND (l.price BETWEEN $3 AND $4 OR l.title %> $5)
      ORDER BY similarity(l.title, $5) DESC, l.views DESC
      LIMIT 6
    `, [id, ref.category_id, minP, maxP, ref.title]);

    res.json({ items: sim.rows });
  } catch (e) { next(e); }
});

export default router;
