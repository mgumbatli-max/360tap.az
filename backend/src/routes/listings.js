import { Router } from 'express';
import { z } from 'zod';
import { query, pool } from '../db.js';
import { authRequired, authOptional } from '../middleware/auth.js';
import { makeSlug } from '../utils/slug.js';

const router = Router();

const listingSchema = z.object({
  title: z.string().min(5).max(120),
  description: z.string().min(20).max(5000),
  category_id: z.string().uuid(),
  city_id: z.string().uuid().optional(),
  price: z.number().nonnegative().optional(),
  currency: z.enum(['AZN', 'USD', 'EUR']).default('AZN'),
  price_type: z.enum(['fixed', 'negotiable', 'free', 'exchange']).default('fixed'),
  condition: z.enum(['new', 'like_new', 'used']).optional(),
  attributes: z.record(z.any()).optional(),
  contact_name: z.string().max(120).optional(),
  contact_phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  media: z.array(z.string().url()).max(20).optional(),
});

// LIST + SEARCH
router.get('/', authOptional, async (req, res, next) => {
  try {
    const {
      q, category, city, min_price, max_price, condition,
      has_delivery, has_credit, has_barter, with_photo, only_shops,
      sort = 'new', cursor, limit = 24,
    } = req.query;

    const lim = Math.min(Number(limit) || 24, 60);
    const params = [];
    const where = [`l.status = 'active'`];

    if (q) {
      // Dərin axtarış: sinonim + AZ↔Latin + range parsing + multi-field
      const { parseQuery, azToLatin } = await import('../utils/search-helpers.js');
      const parsed = parseQuery(q);
      const term = parsed.normalized || q;
      const lat = azToLatin(term);

      params.push(`%${term}%`);
      params.push(`%${lat}%`);
      params.push(term);
      const likIdx = params.length - 2;
      const latIdx = params.length - 1;
      const simIdx = params.length;

      where.push(`(
        l.title %> $${simIdx}
        OR az_to_latin(l.title) %> az_to_latin($${simIdx})
        OR lower(l.title) ILIKE $${likIdx}
        OR az_to_latin(l.title) ILIKE az_to_latin($${likIdx})
        OR az_to_latin(l.title) ILIKE az_to_latin($${latIdx})
        OR lower(l.description) ILIKE $${likIdx}
        OR az_to_latin(l.description) ILIKE az_to_latin($${likIdx})
        OR az_to_latin(c.name_az) ILIKE az_to_latin($${likIdx})
        OR l.attributes::text ILIKE $${likIdx}
      )`);

      // Excludes
      parsed.excludes.forEach((ex) => {
        params.push(`%${ex}%`);
        where.push(`l.title NOT ILIKE $${params.length}`);
      });
      // Phrase quotes
      parsed.phrases.forEach((p) => {
        params.push(`%${p}%`);
        where.push(`(l.title ILIKE $${params.length} OR l.description ILIKE $${params.length})`);
      });
      // Range "1000-2000"
      if (parsed.priceMin) { params.push(parsed.priceMin); where.push(`l.price >= $${params.length}`); }
      if (parsed.priceMax) { params.push(parsed.priceMax); where.push(`l.price <= $${params.length}`); }
    }
    if (category) {
      params.push(category);
      where.push(`(c.slug = $${params.length} OR p.slug = $${params.length})`);
    }
    if (city) {
      params.push(city);
      where.push(`ct.slug = $${params.length}`);
    }
    if (min_price) {
      params.push(Number(min_price));
      where.push(`l.price >= $${params.length}`);
    }
    if (max_price) {
      params.push(Number(max_price));
      where.push(`l.price <= $${params.length}`);
    }
    if (condition) {
      params.push(condition);
      where.push(`l.condition = $${params.length}`);
    }
    if (has_delivery === 'true' || has_delivery === '1') where.push(`l.has_delivery = true`);
    if (has_credit   === 'true' || has_credit   === '1') where.push(`l.has_credit = true`);
    if (has_barter   === 'true' || has_barter   === '1') where.push(`l.has_barter = true`);
    if (with_photo   === 'true' || with_photo   === '1') where.push(`EXISTS (SELECT 1 FROM listing_media m WHERE m.listing_id = l.id)`);
    if (only_shops   === 'true' || only_shops   === '1') where.push(`u.is_business = true`);

    // Dinamik atribut filtrləri: ?attr_brand=BMW&attr_year_min=2018&attr_year_max=2023
    for (const [key, val] of Object.entries(req.query)) {
      if (!key.startsWith('attr_') || !val) continue;
      const m = key.match(/^attr_(.+?)(_min|_max)?$/);
      if (!m) continue;
      const attrKey = m[1];
      const op = m[2];
      if (op === '_min') {
        params.push(Number(val));
        where.push(`(l.attributes->>'${attrKey.replace(/[^a-zA-Z0-9_]/g, '')}')::numeric >= $${params.length}`);
      } else if (op === '_max') {
        params.push(Number(val));
        where.push(`(l.attributes->>'${attrKey.replace(/[^a-zA-Z0-9_]/g, '')}')::numeric <= $${params.length}`);
      } else {
        params.push(String(val));
        where.push(`l.attributes->>'${attrKey.replace(/[^a-zA-Z0-9_]/g, '')}' = $${params.length}`);
      }
    }

    if (cursor) {
      params.push(cursor);
      where.push(`l.created_at < $${params.length}`);
    }

    // Sıralama (axtarış üçün relevance)
    let order = 'l.is_vip DESC, l.created_at DESC';
    if (sort === 'price_asc')  order = 'l.price ASC NULLS LAST';
    if (sort === 'price_desc') order = 'l.price DESC NULLS LAST';
    if (sort === 'popular')    order = 'l.views DESC';
    // Relevance — yalnız axtarış sorğusu olduqda
    if (q && (sort === 'new' || !sort)) {
      // Trigram similarity ilə sırala, sonra VIP, sonra tarix
      // İlk axtarış parametri title %> üçün istifadə olunur
      const simIdx = params.findIndex((p) => typeof p === 'string' && !p.startsWith('%'));
      if (simIdx >= 0) {
        order = `l.is_vip DESC, similarity(l.title, $${simIdx + 1}) DESC, l.created_at DESC`;
      }
    }

    params.push(lim);
    const sql = `
      SELECT l.id, l.title, l.slug, l.price, l.currency, l.price_type,
             l.condition, l.is_vip, l.is_premium, l.is_highlight,
             l.views, l.created_at, l.expires_at,
             c.slug AS category_slug, c.name_az AS category_name,
             ct.slug AS city_slug, ct.name_az AS city_name,
             u.id AS owner_id, u.full_name AS owner_name, u.avatar_url AS owner_avatar,
             u.rating AS owner_rating,
             COALESCE((
               SELECT json_agg(json_build_object('url', m.url, 'sort_order', m.sort_order)
                               ORDER BY m.sort_order)
               FROM listing_media m WHERE m.listing_id = l.id
             ), '[]'::json) AS media
      FROM listings l
      JOIN categories c ON c.id = l.category_id
      LEFT JOIN categories p ON p.id = c.parent_id
      LEFT JOIN cities ct   ON ct.id = l.city_id
      JOIN users u ON u.id = l.owner_id
      WHERE ${where.join(' AND ')}
      ORDER BY ${order}
      LIMIT $${params.length}
    `;
    const { rows } = await query(sql, params);
    const next_cursor = rows.length === lim ? rows[rows.length - 1].created_at : null;

    // Count (filter ilə)
    const countParams = params.slice(0, -1);
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM listings l
      JOIN categories c ON c.id = l.category_id
      LEFT JOIN categories p ON p.id = c.parent_id
      LEFT JOIN cities ct ON ct.id = l.city_id
      WHERE ${where.join(' AND ')}
    `;
    const cnt = await query(countSql, countParams);
    res.json({ items: rows, next_cursor, total: cnt.rows[0].total });
  } catch (e) { next(e); }
});

// DETAIL
router.get('/:id', authOptional, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT l.*,
              c.slug AS category_slug, c.name_az AS category_name,
              ct.slug AS city_slug, ct.name_az AS city_name,
              u.id AS owner_id, u.full_name AS owner_name, u.avatar_url AS owner_avatar,
              u.rating AS owner_rating, u.reviews_count AS owner_reviews_count,
              u.created_at AS owner_since, u.is_business AS owner_is_business,
              COALESCE((
                SELECT json_agg(json_build_object('url', m.url, 'sort_order', m.sort_order)
                                ORDER BY m.sort_order)
                FROM listing_media m WHERE m.listing_id = l.id
              ), '[]'::json) AS media
       FROM listings l
       JOIN categories c ON c.id = l.category_id
       LEFT JOIN cities ct ON ct.id = l.city_id
       JOIN users u ON u.id = l.owner_id
       WHERE l.id = $1 AND l.status = 'active'`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Elan tapılmadı' });

    // Baxış sayğacı
    await query(`UPDATE listings SET views = views + 1 WHERE id = $1`, [req.params.id]);

    res.json({ listing: rows[0] });
  } catch (e) { next(e); }
});

// CREATE
router.post('/', authRequired, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const data = listingSchema.parse(req.body);
    const slug = `${makeSlug(data.title)}-${Date.now().toString(36)}`;

    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO listings (
         owner_id, category_id, city_id, title, slug, description,
         price, currency, price_type, condition, attributes,
         contact_name, contact_phone, address, lat, lng
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        req.user.sub, data.category_id, data.city_id || null,
        data.title, slug, data.description,
        data.price ?? null, data.currency, data.price_type,
        data.condition || null, JSON.stringify(data.attributes || {}),
        data.contact_name || null, data.contact_phone || null,
        data.address || null, data.lat || null, data.lng || null,
      ]
    );
    const listing = rows[0];

    if (data.media?.length) {
      for (let i = 0; i < data.media.length; i++) {
        await client.query(
          `INSERT INTO listing_media (listing_id, url, sort_order) VALUES ($1, $2, $3)`,
          [listing.id, data.media[i], i]
        );
      }
    }
    await client.query('COMMIT');
    res.status(201).json({ listing });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    next(e);
  } finally {
    client.release();
  }
});

// UPDATE
router.patch('/:id', authRequired, async (req, res, next) => {
  try {
    const { rows: own } = await query(`SELECT owner_id FROM listings WHERE id = $1`, [req.params.id]);
    if (!own[0]) return res.status(404).json({ error: 'Tapılmadı' });
    if (own[0].owner_id !== req.user.sub && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'İcazəniz yoxdur' });
    }
    const data = listingSchema.partial().parse(req.body);
    const fields = Object.keys(data).filter((k) => k !== 'media');
    if (!fields.length) return res.json({ ok: true });
    const setSql = fields.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = fields.map((k) => (k === 'attributes' ? JSON.stringify(data[k]) : data[k]));
    const { rows } = await query(
      `UPDATE listings SET ${setSql} WHERE id = $1 RETURNING *`,
      [req.params.id, ...values]
    );
    res.json({ listing: rows[0] });
  } catch (e) { next(e); }
});

// DELETE
router.delete('/:id', authRequired, async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT owner_id FROM listings WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Tapılmadı' });
    if (rows[0].owner_id !== req.user.sub && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'İcazəniz yoxdur' });
    }
    await query(`UPDATE listings SET status = 'archived' WHERE id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// FAVORITES
router.post('/:id/favorite', authRequired, async (req, res, next) => {
  try {
    await query(
      `INSERT INTO favorites (user_id, listing_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [req.user.sub, req.params.id]
    );
    await query(`UPDATE listings SET favorites_count = favorites_count + 1 WHERE id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.delete('/:id/favorite', authRequired, async (req, res, next) => {
  try {
    const r = await query(
      `DELETE FROM favorites WHERE user_id = $1 AND listing_id = $2`,
      [req.user.sub, req.params.id]
    );
    if (r.rowCount > 0) {
      await query(`UPDATE listings SET favorites_count = GREATEST(favorites_count - 1, 0) WHERE id = $1`, [req.params.id]);
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// SIMILAR
router.get('/:id/similar', async (req, res, next) => {
  try {
    const cur = await query(`SELECT category_id, price FROM listings WHERE id = $1`, [req.params.id]);
    if (!cur.rows[0]) return res.json({ items: [] });
    const { category_id, price } = cur.rows[0];

    const { rows } = await query(
      `SELECT l.id, l.title, l.price, l.currency, l.created_at,
              ct.name_az AS city_name,
              (SELECT url FROM listing_media WHERE listing_id = l.id ORDER BY sort_order LIMIT 1) AS cover
       FROM listings l
       LEFT JOIN cities ct ON ct.id = l.city_id
       WHERE l.status = 'active' AND l.id != $1 AND l.category_id = $2
       ORDER BY ABS(COALESCE(l.price, 0) - $3) ASC, l.created_at DESC
       LIMIT 8`,
      [req.params.id, category_id, Number(price) || 0]
    );
    res.json({ items: rows });
  } catch (e) { next(e); }
});

// REPORT (şikayət)
router.post('/:id/report', authRequired, async (req, res, next) => {
  try {
    const { reason, detail } = req.body;
    const validReasons = ['fake', 'wrong_category', 'banned_item', 'wrong_price',
                          'spam', 'fraud', 'offensive', 'duplicate', 'other'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: 'Yanlış səbəb' });
    }
    const { rows: ex } = await query(`SELECT id FROM listings WHERE id = $1`, [req.params.id]);
    if (!ex[0]) return res.status(404).json({ error: 'Elan tapılmadı' });

    await query(
      `INSERT INTO complaints (reporter_id, listing_id, reason, detail)
       VALUES ($1, $2, $3, $4)`,
      [req.user.sub, req.params.id, reason, detail || null]
    );
    res.status(201).json({ ok: true, message: 'Şikayət qəbul edildi' });
  } catch (e) { next(e); }
});

// PHONE CLICK tracking
router.post('/:id/phone-click', async (req, res, next) => {
  try {
    await query(
      `UPDATE listings SET views = views WHERE id = $1`,  // sayğac (phone_clicks əlavə oluna bilər)
      [req.params.id]
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// MARK SOLD
router.post('/:id/sold', authRequired, async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT owner_id FROM listings WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Tapılmadı' });
    if (rows[0].owner_id !== req.user.sub && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'İcazəniz yoxdur' });
    }
    await query(`UPDATE listings SET status = 'sold' WHERE id = $1`, [req.params.id]);
    res.json({ ok: true, message: 'Elan satıldı kimi qeyd edildi' });
  } catch (e) { next(e); }
});

// REACTIVATE (arxivdən geri)
router.post('/:id/reactivate', authRequired, async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT owner_id FROM listings WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Tapılmadı' });
    if (rows[0].owner_id !== req.user.sub) return res.status(403).json({ error: 'İcazəniz yoxdur' });
    await query(
      `UPDATE listings SET status = 'active', expires_at = NOW() + INTERVAL '30 days' WHERE id = $1`,
      [req.params.id]
    );
    res.json({ ok: true, message: 'Elan yenidən aktivləşdirildi' });
  } catch (e) { next(e); }
});

// BUMP (yuxarı qaldır)
router.post('/:id/bump', authRequired, async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT owner_id FROM listings WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Tapılmadı' });
    if (rows[0].owner_id !== req.user.sub) return res.status(403).json({ error: 'İcazəniz yoxdur' });
    await query(`UPDATE listings SET created_at = NOW() WHERE id = $1`, [req.params.id]);
    res.json({ ok: true, message: 'Elan yuxarı qaldırıldı' });
  } catch (e) { next(e); }
});

// MY LISTINGS
router.get('/me/list', authRequired, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT l.id, l.title, l.slug, l.price, l.currency, l.status, l.views,
              l.favorites_count, l.created_at, l.expires_at,
              (SELECT url FROM listing_media WHERE listing_id = l.id ORDER BY sort_order LIMIT 1) AS cover
       FROM listings l WHERE l.owner_id = $1 ORDER BY l.created_at DESC`,
      [req.user.sub]
    );
    res.json({ items: rows });
  } catch (e) { next(e); }
});

export default router;
