const express = require('express');
const StrategyRegistry = require('../strategies/StrategyRegistry');

const router = express.Router();

router.get('/strategy-kinds', (req, res) => {
  res.json({ items: StrategyRegistry.listKinds() });
});

router.post('/strategies/validate', (req, res) => {
  const { kind, params } = req.body || {};
  if (!kind) return res.status(400).json({ error: { message: 'Missing kind' } });
  try {
    const result = StrategyRegistry.validate(kind, params || {});
    if (result.valid) res.json({ ok: true });
    else res.status(400).json({ errors: result.errors });
  } catch (e) {
    res.status(400).json({ error: { message: e.message } });
  }
});

router.post('/strategies/preview', (req, res) => {
  const { kind, params, ohlcv } = req.body || {};
  if (!kind) return res.status(400).json({ error: { message: 'Missing kind' } });
  try {
    const result = StrategyRegistry.preview(kind, params || {}, ohlcv || []);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: { message: e.message } });
  }
});

module.exports = router;