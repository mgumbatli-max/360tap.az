export function notFound(_req, res) {
  res.status(404).json({ error: 'Tapılmadı' });
}

export function errorHandler(err, _req, res, _next) {
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Validasiya xətası', details: err.errors });
  }
  console.error('[error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Daxili server xətası',
  });
}
