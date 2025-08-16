const express = require('express');

// Skeleton routes for strategy instances. Real implementation should
// persist data and trigger backtests as needed.
const router = express.Router();

router.post('/strategies', (req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});

router.get('/strategies/:id', (req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});

router.patch('/strategies/:id', (req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});

router.post('/strategies/:id/run-backtest', (req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});

router.get('/strategies/:id/signals', (req, res) => {
  res.status(501).json({ error: 'Not implemented' });
});

module.exports = router;