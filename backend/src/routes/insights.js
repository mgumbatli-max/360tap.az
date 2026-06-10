import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// GET /insights/price?category=X — kateqoriya üzrə qiymət analitikası
router.get('/price', async (req, res, next) => {
  try {
    const { category, brand, min, max } = req.query;
    const params = [];
    const where = [`status='active'`, `price IS NOT NULL`, `price > 0`];

    if (category) {
      params.push(category);
      where.push(`category_id IN (SELECT id FROM categories WHERE slug = $${params.length})`);
    }
    if (brand) {
      params.push(brand);
      where.push(`attributes->>'brand' = $${params.length}`);
    }
    if (min) { params.push(Number(min)); where.push(`price >= $${params.length}`); }
    if (max) { params.push(Number(max)); where.push(`price <= $${params.length}`); }

    const r = await query(
      `SELECT
         COUNT(*)::int AS sample_size,
         ROUND(AVG(price)::numeric, 0)::float AS avg_price,
         percentile_cont(0.5) WITHIN GROUP (ORDER BY price)::float AS median,
         percentile_cont(0.25) WITHIN GROUP (ORDER BY price)::float AS p25,
         percentile_cont(0.75) WITHIN GROUP (ORDER BY price)::float AS p75,
         MIN(price)::float AS min,
         MAX(price)::float AS max
       FROM listings WHERE ${where.join(' AND ')}`,
      params
    );
    res.json({ stats: r.rows[0] });
  } catch (e) { next(e); }
});

// GET /insights/listing/:id/price-position — bu listing-in qiymət mövqeyi
router.get('/listing/:id/price-position', async (req, res, next) => {
  try {
    const { rows: l } = await query(
      `SELECT category_id, price, currency, attributes FROM listings WHERE id = $1`,
      [req.params.id]
    );
    if (!l[0]) return res.status(404).json({ error: 'Tapılmadı' });
    if (!l[0].price) return res.json({ position: null });

    const brand = l[0].attributes?.brand;
    const params = [l[0].category_id, l[0].price];
    let brandFilter = '';
    if (brand) {
      params.push(brand);
      brandFilter = `AND attributes->>'brand' = $3`;
    }

    const r = await query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE price < $2)::int AS below,
         COUNT(*) FILTER (WHERE price > $2)::int AS above,
         AVG(price)::float AS avg,
         percentile_cont(0.5) WITHIN GROUP (ORDER BY price)::float AS median
       FROM listings
       WHERE status='active' AND category_id = $1 AND price IS NOT NULL ${brandFilter}`,
      params
    );

    const data = r.rows[0];
    const positionPct = data.total > 1 ? Math.round((data.below / data.total) * 100) : 50;
    const myPrice = Number(l[0].price);
    const ratio = myPrice / data.median;

    let assessment = 'orta';
    let label = '✓ Orta bazar qiyməti';
    if (ratio < 0.85) { assessment = 'low';  label = '✓ Yaxşı qiymət — bazardan ucuz'; }
    if (ratio > 1.20) { assessment = 'high'; label = '⚠ Bazardan baha — qiyməti yenidən nəzərdən keçirin'; }

    res.json({
      position: positionPct,    // 0-100, neçə % aşağıda
      median: data.median,
      avg: data.avg,
      sample: data.total,
      myPrice,
      assessment, // low/medium/high
      label,
    });
  } catch (e) { next(e); }
});

export default router;