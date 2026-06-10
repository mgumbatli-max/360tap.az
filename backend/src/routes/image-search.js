import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { pool } from '../db.js';

const router = Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `imgsearch_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
    cb(null, name);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Yalnız şəkil'));
    cb(null, true);
  },
});

// Mock AI vision — fayl adına və ölçüsünə görə kateqoriya təxmini
const HINTS = {
  telefon: ['phone', 'iphone', 'samsung', 'xiaomi', 'galaxy', 'tel', 'smart'],
  noutbuk: ['laptop', 'notebook', 'macbook', 'noutbuk', 'asus', 'hp', 'lenovo', 'dell'],
  kompyuter: ['pc', 'desktop', 'monitor', 'computer'],
  avtomobil: ['car', 'auto', 'bmw', 'mercedes', 'toyota', 'audi', 'lada', 'hyundai', 'kia', 'machine'],
  saat: ['watch', 'rolex', 'casio', 'saat', 'clock'],
  ayaqqabi: ['shoe', 'nike', 'adidas', 'sneaker', 'boot', 'ayaqqabi'],
  geyim: ['shirt', 'pants', 'jacket', 'paltar', 'geyim', 'dress'],
  mebel: ['sofa', 'chair', 'table', 'mebel', 'furniture'],
  heyvanlar: ['cat', 'dog', 'pet', 'animal', 'kitten', 'puppy', 'it', 'pisik'],
  oyuncaq: ['toy', 'lego', 'usaq', 'oyuncaq'],
  evcil: ['fridge', 'washer', 'tv', 'tele', 'soyuducu'],
};

function detectCategory(filename) {
  const lower = filename.toLowerCase();
  for (const [slug, kws] of Object.entries(HINTS)) {
    if (kws.some(k => lower.includes(k))) return slug;
  }
  return null;
}

// Brand detection
const BRANDS = ['BMW','Mercedes','Toyota','Audi','Hyundai','Kia','iPhone','Samsung','Xiaomi','MacBook','Nike','Adidas','Rolex','Casio','Sony','LG'];
function detectBrand(filename) {
  const lower = filename.toLowerCase();
  return BRANDS.find(b => lower.includes(b.toLowerCase())) || null;
}

// Color detection (mock — random from common colors)
const COLORS = ['ağ', 'qara', 'gümüş', 'mavi', 'qırmızı', 'boz'];

router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Şəkil yüklənməyib' });

    const filename = req.file.originalname || req.file.filename;
    const url = `/uploads/${req.file.filename}`;
    const fullUrl = `http://localhost:5400${url}`;
    const size = req.file.size;
    const fileHash = crypto.createHash('md5').update(req.file.filename).digest('hex');

    // AI mock analysis
    const category = detectCategory(filename);
    const brand = detectBrand(filename);
    const colorIdx = parseInt(fileHash.slice(0, 2), 16) % COLORS.length;
    const detectedColor = COLORS[colorIdx];

    // Confidence (mock) — based on whether we detected something
    const confidence = category ? (brand ? 92 : 78) : 45;

    // Find similar listings
    let similarItems = [];
    try {
      let whereClause = `WHERE l.status='published'`;
      const params = [];
      let idx = 1;

      if (category) {
        whereClause += ` AND c.slug = $${idx}`;
        params.push(category);
        idx++;
      }
      if (brand) {
        whereClause += ` AND (l.title ILIKE $${idx} OR l.attributes::text ILIKE $${idx})`;
        params.push(`%${brand}%`);
        idx++;
      }

      const q = `
        SELECT l.id, l.title, l.price, l.currency, l.created_at,
               c.name_az AS category_name,
               (SELECT json_build_object('url', m.url) FROM listing_media m WHERE m.listing_id=l.id ORDER BY m.position LIMIT 1) AS cover,
               (SELECT name FROM cities WHERE id = l.city_id) AS city_name
        FROM listings l
        LEFT JOIN categories c ON c.id = l.category_id
        ${whereClause}
        ORDER BY l.created_at DESC
        LIMIT 12
      `;
      const r = await pool.query(q, params);
      similarItems = r.rows;
    } catch (e) {
      console.error('image-search query err:', e.message);
    }

    // Əgər heç biri tapılmadısa popular göstər
    if (similarItems.length === 0) {
      try {
        const fb = await pool.query(`
          SELECT l.id, l.title, l.price, l.currency, l.created_at,
                 (SELECT json_build_object('url', m.url) FROM listing_media m WHERE m.listing_id=l.id ORDER BY m.position LIMIT 1) AS cover
          FROM listings l
          WHERE l.status='published'
          ORDER BY l.views DESC NULLS LAST
          LIMIT 8
        `);
        similarItems = fb.rows;
      } catch {}
    }

    res.json({
      uploaded: { url, fullUrl, filename, size },
      analysis: {
        category,
        brand,
        color: detectedColor,
        confidence,
        labels: [category, brand, detectedColor].filter(Boolean),
      },
      similar: similarItems,
      total: similarItems.length,
    });
  } catch (e) {
    console.error('image-search error:', e.message);
    next(e);
  }
});

export default router;
