import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, slug, name_az, name_ru, name_en, region, sort_order
       FROM cities ORDER BY sort_order, name_az`
    );
    res.json({ cities: rows });
  } catch (e) { next(e); }
});

export default router;
