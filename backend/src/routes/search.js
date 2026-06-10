import { Router } from 'express';
import { query } from '../db.js';
import { parseQuery, azToLatin } from '../utils/search-helpers.js';

const router = Router();

// === Multi-source suggestions: listings, categories, cities, brands ===
router.get('/suggestions', async (req, res, next) => {
  try {
    const raw = String(req.query.q || '').trim();
    if (raw.length < 1) return res.json({ suggestions: [], categories: [], cities: [], brands: [] });

    const parsed = parseQuery(raw);
    const term = parsed.normalized || raw;
    const pattern = `%${term}%`;
    const lat = azToLatin(term);
    const latPattern = `%${lat}%`;

    // 1) Listings (similarity ranked) — title + category match
    const listings = await query(
      `SELECT id, title, slug, price, currency, city_name, category_name, score
       FROM (
         SELECT DISTINCT ON (lower(l.title))
                l.id, l.title, l.slug, l.price, l.currency,
                ct.name_az AS city_name, c.name_az AS category_name,
                GREATEST(
                  COALESCE(similarity(l.title, $1), 0),
                  COALESCE(similarity(c.name_az, $1), 0) * 0.7
                ) AS score
         FROM listings l
         JOIN categories c ON c.id = l.category_id
         LEFT JOIN cities ct ON ct.id = l.city_id
         WHERE l.status = 'active'
           AND (l.title %> $1 OR l.title ILIKE $2 OR l.title ILIKE $3 OR c.name_az ILIKE $2)
         ORDER BY lower(l.title), score DESC
       ) sub
       ORDER BY score DESC, title
       LIMIT 8`,
      [term, pattern, latPattern]
    );

    // 2) Categories (yumşaq match)
    const categories = await query(
      `SELECT slug, name_az, similarity(name_az, $1) AS score
       FROM categories
       WHERE is_active = true AND (name_az %> $1 OR name_az ILIKE $2)
       ORDER BY score DESC, name_az LIMIT 5`,
      [term, pattern]
    );

    // 3) Cities
    const cities = await query(
      `SELECT slug, name_az, similarity(name_az, $1) AS score
       FROM cities
       WHERE name_az %> $1 OR name_az ILIKE $2
       ORDER BY score DESC LIMIT 4`,
      [term, pattern]
    );

    // 4) Brands (attributes.brand-dən)
    const brands = await query(
      `SELECT DISTINCT lower(attributes->>'brand') AS brand, COUNT(*)::int AS cnt
       FROM listings
       WHERE status='active' AND attributes->>'brand' IS NOT NULL
         AND lower(attributes->>'brand') ILIKE $1
       GROUP BY lower(attributes->>'brand')
       ORDER BY cnt DESC LIMIT 5`,
      [pattern]
    );

    res.json({
      suggestions: listings.rows,
      categories: categories.rows,
      cities: cities.rows,
      brands: brands.rows.map((b) => ({ name: b.brand, count: b.cnt })),
      query: raw,
    });
  } catch (e) { next(e); }
});

// === "Did you mean" — Levenshtein-bənzər təklif ===
router.get('/did-you-mean', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 3) return res.json({ suggestion: null });

    const r = await query(
      `SELECT title, similarity(title, $1) AS score
       FROM listings WHERE status='active' AND similarity(title, $1) > 0.25
       ORDER BY similarity(title, $1) DESC LIMIT 5`,
      [q]
    );

    if (!r.rows.length) return res.json({ suggestion: null });

    // ən uzun ortaq prefix tap, yaxud yaxın söz
    const top = r.rows[0];
    if (top.score < 0.95 && top.score > 0.3) {
      // İlk söz fərqli olarsa onu təklif et
      const tokens = top.title.toLowerCase().split(/\s+/);
      const queryTokens = q.toLowerCase().split(/\s+/);
      const suggested = queryTokens.map((qt) => {
        const closest = tokens.reduce((best, t) => {
          const sim = simpleSim(qt, t);
          return sim > best.sim ? { word: t, sim } : best;
        }, { word: qt, sim: 0 });
        return closest.sim > 0.5 ? closest.word : qt;
      }).join(' ');

      if (suggested !== q.toLowerCase()) {
        return res.json({ suggestion: suggested, original: q, score: Number(top.score) });
      }
    }
    res.json({ suggestion: null });
  } catch (e) { next(e); }
});

function simpleSim(a, b) {
  if (a === b) return 1;
  if (Math.abs(a.length - b.length) > 3) return 0;
  let same = 0;
  const min = Math.min(a.length, b.length);
  for (let i = 0; i < min; i++) if (a[i] === b[i]) same++;
  return same / Math.max(a.length, b.length);
}

// === Search facets — filter aggregations ===
router.get('/facets', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const params = [];
    let where = `status='active'`;
    if (q) {
      params.push(`%${q}%`);
      where += ` AND (title ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }

    // Kateqoriya bölgüsü
    const cats = await query(
      `SELECT c.slug, c.name_az, COUNT(*)::int AS cnt
       FROM listings l JOIN categories c ON c.id = l.category_id
       WHERE l.${where}
       GROUP BY c.slug, c.name_az
       ORDER BY cnt DESC LIMIT 15`,
      params.map((p) => p)
    );

    // Şəhər bölgüsü
    const cities = await query(
      `SELECT ct.slug, ct.name_az, COUNT(*)::int AS cnt
       FROM listings l JOIN cities ct ON ct.id = l.city_id
       WHERE l.${where}
       GROUP BY ct.slug, ct.name_az
       ORDER BY cnt DESC LIMIT 12`,
      params.map((p) => p)
    );

    // Qiymət bölgüsü
    const prices = await query(
      `SELECT
         COUNT(*) FILTER (WHERE price < 100)::int AS p100,
         COUNT(*) FILTER (WHERE price >= 100 AND price < 1000)::int AS p1k,
         COUNT(*) FILTER (WHERE price >= 1000 AND price < 10000)::int AS p10k,
         COUNT(*) FILTER (WHERE price >= 10000 AND price < 100000)::int AS p100k,
         COUNT(*) FILTER (WHERE price >= 100000)::int AS p_high
       FROM listings l WHERE ${where}`,
      params.map((p) => p)
    );

    res.json({
      categories: cats.rows,
      cities: cities.rows,
      priceRanges: prices.rows[0],
    });
  } catch (e) { next(e); }
});

// === Populyar axtarışlar ===
router.get('/popular', async (_req, res, next) => {
  try {
    const r = await query(
      `SELECT lower(query) AS q, COUNT(*)::int AS c
       FROM search_logs
       WHERE created_at > NOW() - INTERVAL '30 days' AND length(query) > 2
       GROUP BY lower(query) ORDER BY c DESC LIMIT 12`
    );
    if (r.rows.length === 0) {
      return res.json({
        popular: ['iPhone 15', 'BMW X5', 'Mənzil Yasamal', 'MacBook',
                  'PlayStation 5', 'Avtomobil', 'Mənzil kirayə',
                  'Frontend Developer', 'Honda Civic', 'Diş həkimi',
                  'Mənzil Bakı', 'Toyota'],
      });
    }
    res.json({ popular: r.rows.map((x) => x.q) });
  } catch (e) { next(e); }
});

// === Axtarışı log et ===
router.post('/log', async (req, res, next) => {
  try {
    const { query: q, filters, results_count } = req.body;
    if (!q || q.length < 2) return res.json({ ok: true });
    await query(
      `INSERT INTO search_logs (user_id, query, filters, results_count)
       VALUES ($1, $2, $3, $4)`,
      [req.user?.sub || null, q, JSON.stringify(filters || {}), results_count || 0]
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
