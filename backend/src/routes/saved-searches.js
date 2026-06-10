import { Router } from 'express';
import { query } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.get('/', authRequired, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, name, query, filters, notify_email, created_at
       FROM saved_searches WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.sub]
    );
    res.json({ items: rows });
  } catch (e) { next(e); }
});

router.post('/', authRequired, async (req, res, next) => {
  try {
    const { name, query: q, filters, notify_email = true } = req.body;
    if (!name) return res.status(400).json({ error: 'Ad tələb olunur' });
    const { rows } = await query(
      `INSERT INTO saved_searches (user_id, name, query, filters, notify_email)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, query, filters, notify_email, created_at`,
      [req.user.sub, name, q || null, JSON.stringify(filters || {}), notify_email]
    );
    res.status(201).json({ search: rows[0] });
  } catch (e) { next(e); }
});

router.delete('/:id', authRequired, async (req, res, next) => {
  try {
    await query(`DELETE FROM saved_searches WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.sub]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
