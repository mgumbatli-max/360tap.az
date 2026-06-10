import { Router } from 'express';
const router = Router();

router.post('/', (req, res) => {
  const { error, stack, url, userAgent, type } = req.body;
  console.log('═════════════════ CLIENT ERROR ═════════════════');
  console.log('Type:', type || 'error');
  console.log('URL:', url);
  console.log('UA:', userAgent);
  console.log('Error:', error);
  if (stack) console.log('Stack:', stack.slice(0, 800));
  console.log('═══════════════════════════════════════════════════');
  res.json({ ok: true });
});

export default router;
