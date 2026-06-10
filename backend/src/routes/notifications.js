import { Router } from 'express';
import { query } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// GET /notifications
router.get('/', authRequired, async (req, res, next) => {
  try {
    const unread = req.query.unread_only === 'true';
    const { rows } = await query(
      `SELECT id, type, title, body, data, is_read, created_at, read_at
       FROM notifications
       WHERE user_id = $1 ${unread ? 'AND is_read = false' : ''}
       ORDER BY created_at DESC LIMIT 100`,
      [req.user.sub]
    );
    res.json({ items: rows });
  } catch (e) { next(e); }
});

// GET /notifications/count
router.get('/count', authRequired, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT COUNT(*)::int AS unread FROM notifications WHERE user_id = $1 AND is_read = false`,
      [req.user.sub]
    );
    res.json({ unread: rows[0].unread });
  } catch (e) { next(e); }
});

// PATCH /notifications/:id/read
router.patch('/:id/read', authRequired, async (req, res, next) => {
  try {
    await query(
      `UPDATE notifications SET is_read = true, read_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.sub]
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// POST /notifications/read-all
router.post('/read-all', authRequired, async (req, res, next) => {
  try {
    await query(
      `UPDATE notifications SET is_read = true, read_at = NOW()
       WHERE user_id = $1 AND is_read = false`,
      [req.user.sub]
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
