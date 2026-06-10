import { Router } from 'express';
import { query } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

const VALID_TARGETS = ['listing', 'user', 'message', 'review'];
const VALID_REASONS = [
  'fake', 'wrong_category', 'banned_item', 'wrong_price',
  'spam', 'fraud', 'offensive', 'duplicate', 'other',
];

router.post('/', authRequired, async (req, res, next) => {
  try {
    const { target_type, target_id, reason, detail } = req.body;
    if (!VALID_TARGETS.includes(target_type)) {
      return res.status(400).json({ error: 'target_type yanlışdır' });
    }
    if (!VALID_REASONS.includes(reason)) {
      return res.status(400).json({ error: 'reason yanlışdır' });
    }
    const listing_id = target_type === 'listing' ? target_id : null;
    const user_id = target_type === 'user' ? target_id : null;
    const { rows } = await query(
      `INSERT INTO complaints (reporter_id, listing_id, user_id, reason, detail)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, status, created_at`,
      [req.user.sub, listing_id, user_id, reason, detail || null]
    );
    res.status(201).json({ complaint: rows[0] });
  } catch (e) { next(e); }
});

router.get('/me', authRequired, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, listing_id, user_id, reason, detail, status, created_at, resolved_at
       FROM complaints WHERE reporter_id = $1 ORDER BY created_at DESC`,
      [req.user.sub]
    );
    res.json({ items: rows });
  } catch (e) { next(e); }
});

export default router;
