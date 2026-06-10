import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// 1. Heatmap — Bakı rayonları üzrə median qiymət
router.get('/heatmap', async (req, res, next) => {
  try {
    const { property_type = 'menzil-satilir' } = req.query;
    const r = await pool.query(`
      SELECT
        l.attributes->>'district' AS district,
        COUNT(*) AS count,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY l.price) AS median,
        AVG(l.price) AS avg,
        AVG(l.price / NULLIF((l.attributes->>'area')::numeric, 0)) AS price_per_sqm
      FROM listings l JOIN categories c ON c.id = l.category_id
      WHERE c.slug = $1 AND l.status='published' AND l.price > 0
        AND l.attributes->>'district' IS NOT NULL
      GROUP BY l.attributes->>'district'
      HAVING COUNT(*) >= 1
      ORDER BY median DESC
      LIMIT 50
    `, [property_type]);
    res.json({ districts: r.rows });
  } catch (e) { next(e); }
});

// 2. Qiymət tendensiyası (son 12 ay)
router.get('/price-trend', async (req, res, next) => {
  try {
    const { property_type = 'menzil-satilir', district } = req.query;
    const r = await pool.query(`
      SELECT
        DATE_TRUNC('month', l.created_at) AS month,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY l.price) AS median,
        COUNT(*) AS count
      FROM listings l JOIN categories c ON c.id = l.category_id
      WHERE c.slug = $1 AND l.status='published' AND l.price > 0
        AND l.created_at > NOW() - INTERVAL '12 months'
        ${district ? `AND l.attributes->>'district' = $2` : ''}
      GROUP BY DATE_TRUNC('month', l.created_at)
      ORDER BY month
    `, district ? [property_type, district] : [property_type]);
    res.json({ trend: r.rows });
  } catch (e) { next(e); }
});

// 3. Pre-approval — gəlirə görə imkan
router.post('/mortgage-preapprove', (req, res) => {
  const { monthly_income = 0, monthly_expenses = 0, has_other_loans = false, rate = 8, years = 20 } = req.body;
  const disposable = Math.max(0, monthly_income - monthly_expenses);
  const safePayment = disposable * 0.40; // 40% of free income
  const monthlyRate = rate / 100 / 12;
  const n = years * 12;
  const maxPrincipal = monthlyRate > 0
    ? safePayment * (Math.pow(1 + monthlyRate, n) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, n))
    : safePayment * n;
  const downPayment = maxPrincipal * 0.20; // 20% standart
  const maxPropertyPrice = maxPrincipal + downPayment;
  const penalty = has_other_loans ? 0.85 : 1.0;
  res.json({
    eligible: monthly_income >= 800,
    max_loan: Math.round(maxPrincipal * penalty),
    suggested_down_payment: Math.round(downPayment),
    max_property_price: Math.round(maxPropertyPrice * penalty),
    safe_monthly_payment: Math.round(safePayment),
    note: has_other_loans
      ? 'Mövcud kreditlər səbəbindən imkanınız 15% azaldıldı'
      : 'Hesab 40% gəlir qaydası ilə aparılıb',
  });
});

// 4. Neighborhood AI Score — məhəllə qiymətləndirməsi
router.get('/neighborhood/:district', async (req, res, next) => {
  try {
    const { district } = req.params;
    // Mock + DB data — gerçəkdə Google Places + OSM
    const SCORES = {
      'Səbail r.':     { walkability: 95, school: 88, safety: 85, transit: 98, parks: 90 },
      'Nəsimi r.':     { walkability: 92, school: 90, safety: 80, transit: 95, parks: 75 },
      'Nərimanov r.':  { walkability: 85, school: 86, safety: 82, transit: 88, parks: 72 },
      'Yasamal r.':    { walkability: 80, school: 85, safety: 88, transit: 80, parks: 85 },
      'Xətai r.':      { walkability: 75, school: 78, safety: 78, transit: 75, parks: 70 },
      'Binəqədi r.':   { walkability: 70, school: 80, safety: 75, transit: 78, parks: 80 },
      'Sabunçu r.':    { walkability: 65, school: 72, safety: 72, transit: 70, parks: 78 },
    };
    const s = SCORES[district] || { walkability: 70, school: 75, safety: 75, transit: 70, parks: 70 };
    const overall = Math.round((s.walkability + s.school + s.safety + s.transit + s.parks) / 5);
    res.json({
      district,
      overall,
      scores: s,
      grade: overall >= 90 ? 'A+' : overall >= 85 ? 'A' : overall >= 80 ? 'B+' : overall >= 75 ? 'B' : 'C',
      summary: overall >= 85
        ? 'Əla yaşayış zonası, hər şey əlçatandır'
        : overall >= 75
        ? 'Yaxşı yaşayış zonası, infrastruktur kifayət edir'
        : 'Orta yaşayış zonası — yaxın infrastrukturu yoxlayın',
    });
  } catch (e) { next(e); }
});

// 5. Verified listing — avtomatik təsdiq qiymətləndirməsi
router.post('/verify-listing', async (req, res, next) => {
  try {
    const { listing_id } = req.body;
    const r = await pool.query(`SELECT * FROM listings WHERE id=$1`, [listing_id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Tapılmadı' });
    const l = r.rows[0];

    let score = 0;
    const checks = [];
    if (l.attributes?.doc) { score += 20; checks.push({ ok: true, name: 'Sənəd növü göstərilib' }); }
    else checks.push({ ok: false, name: 'Sənəd növü göstərilməyib' });
    if (l.attributes?.area) { score += 15; checks.push({ ok: true, name: 'Saha göstərilib' }); }
    else checks.push({ ok: false, name: 'Saha göstərilməyib' });
    if (l.attributes?.floor) { score += 10; checks.push({ ok: true, name: 'Mərtəbə göstərilib' }); }
    else checks.push({ ok: false, name: 'Mərtəbə göstərilməyib' });
    if (l.description && l.description.length > 100) { score += 20; checks.push({ ok: true, name: 'Ətraflı təsvir' }); }
    else checks.push({ ok: false, name: 'Təsvir çox qısa' });
    if (l.contact_phone) { score += 15; checks.push({ ok: true, name: 'Telefon var' }); }
    else checks.push({ ok: false, name: 'Telefon yoxdur' });
    if (l.attributes?.coordinates) { score += 20; checks.push({ ok: true, name: 'Koordinatlar göstərilib' }); }
    else checks.push({ ok: false, name: 'Xəritədə yerləşmə yoxdur' });

    res.json({
      verified: score >= 70,
      score,
      checks,
      badge: score >= 90 ? 'platinum' : score >= 80 ? 'gold' : score >= 70 ? 'silver' : 'none',
    });
  } catch (e) { next(e); }
});

// 6. Saxlanılmış axtarış üçün uyğun yeni elanlar
router.get('/match-saved-searches', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.json({ matches: [] });
    const r = await pool.query(`
      SELECT s.*, COUNT(l.id) AS new_matches
      FROM saved_searches s
      LEFT JOIN listings l ON l.created_at > s.created_at
        AND l.status='published'
        AND (s.query IS NULL OR l.title ILIKE '%' || s.query || '%')
      WHERE s.user_id=$1
      GROUP BY s.id
      HAVING COUNT(l.id) > 0
      ORDER BY new_matches DESC
    `, [userId]);
    res.json({ matches: r.rows });
  } catch (e) { res.json({ matches: [] }); }
});

export default router;
