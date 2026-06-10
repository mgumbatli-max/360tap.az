import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, parent_id, slug, name_az, name_ru, name_en, icon, sort_order
       FROM categories WHERE is_active = true ORDER BY sort_order, name_az`
    );

    const map = new Map();
    rows.forEach((c) => map.set(c.id, { ...c, children: [] }));
    const tree = [];
    rows.forEach((c) => {
      const node = map.get(c.id);
      if (c.parent_id) {
        const parent = map.get(c.parent_id);
        if (parent) parent.children.push(node);
      } else {
        tree.push(node);
      }
    });
    res.json({ categories: tree });
  } catch (e) { next(e); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, parent_id, slug, name_az, name_ru, name_en, icon
       FROM categories WHERE slug = $1`,
      [req.params.slug]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Kateqoriya tapılmadı' });
    res.json({ category: rows[0] });
  } catch (e) { next(e); }
});

// GET /categories/:slug/attributes
router.get('/:slug/attributes', async (req, res, next) => {
  try {
    const cat = await query(`SELECT id FROM categories WHERE slug = $1`, [req.params.slug]);
    if (!cat.rows[0]) return res.status(404).json({ error: 'Kateqoriya tapılmadı' });

    const { rows } = await query(
      `SELECT id, key, label_az, type, options, unit, is_required, is_filterable, sort_order
       FROM category_attributes
       WHERE category_id = $1
       ORDER BY sort_order, label_az`,
      [cat.rows[0].id]
    );
    res.json({ attributes: rows });
  } catch (e) { next(e); }
});

export default router;
