import { Router } from 'express';
import { parseVoiceWithDb } from '../utils/voice-parser.js';

const router = Router();

// POST /voice/parse — səs mətnini smart filtrlərə çevirir
router.post('/parse', async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Mətn tələb olunur' });
    }
    const result = await parseVoiceWithDb(text);

    // Filter parametrlərindən URL yaradır
    const params = new URLSearchParams();
    Object.entries(result.filters).forEach(([k, v]) => {
      if (v) params.set(k, String(v));
    });

    res.json({
      original: result.original,
      filters: result.filters,
      suggestion: result.suggestion,
      url: `/elanlar?${params.toString()}`,
    });
  } catch (e) { next(e); }
});

export default router;
