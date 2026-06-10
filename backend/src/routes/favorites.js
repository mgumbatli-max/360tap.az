import { Router } from 'express';
import { query } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// GET /favorites — istifadəçinin sevimliləri
router.get('/', authRequired, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT l.id, l.title, l.slug, l.price, l.currency, l.price_type,
              l.condition, l.is_vip, l.is_premium, l.views, l.created_at,
              c.slug AS category_slug, c.name_az AS category_name,
              ct.slug AS city_slug, ct.name_az AS city_name,
              u.id AS owner_id, u.full_name AS owner_name, u.rating AS owner_rating,
              COALESCE((
                SELECT json_agg(json_build_object('url', m.url, 'sort_order', m.sort_order)
                                ORDER BY m.sort_order)
                FROM listing_media m WHERE m.listing_id = l.id
              ), '[]'::json) AS media,
              f.created_at AS favorited_at
       FROM favorites f
       JOIN listings l ON l.id = f.listing_id
       JOIN categories c ON c.id = l.category_id
       LEFT JOIN cities ct ON ct.id = l.city_id
       JOIN users u ON u.id = l.owner_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [req.user.sub]
    );
    res.json({ items: rows, total: rows.length });
  } catch (e) { next(e); }
});

// GET /favorites/check?ids=a,b,c — hansılar sevimlidir
router.get('/check', authRequired, async (req, res, next) => {
  try {
    const ids = (req.query.ids || '').split(',').filter(Boolean);
    if (!ids.length) return res.json({ favorites: [] });
    const { rows } = await query(
      `SELECT listing_id FROM favorites WHERE user_id = $1 AND listing_id = ANY($2::uuid[])`,
      [req.user.sub, ids]
    );
    res.json({ favorites: rows.map((r) => r.listing_id) });
  } catch (e) { next(e); }
});

export default router;
