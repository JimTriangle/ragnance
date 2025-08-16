const express = require('express');
const { runBacktest, loadBacktest, listBacktests } = require('../services/backtest/runner');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const arr = await listBacktests();
    const items = arr.map(bt => ({
      id: bt.id,
      pair: bt.params && bt.params.pair,
      timeframe: bt.params && bt.params.timeframe,
      pnlPct: bt.kpis && bt.kpis.pnlPct,
      createdAt: bt.createdAt
    }));
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const params = req.body;
    const result = await runBacktest(params);
    res.status(201).json({ id: result.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



router.get('/:id', async (req, res) => {
  const bt = await loadBacktest(req.params.id);
  if (!bt) return res.status(404).json({ error: 'not found' });
  res.json(bt);
});

router.get('/:id/equity', async (req, res) => {
  const bt = await loadBacktest(req.params.id);
  if (!bt) return res.status(404).json({ error: 'not found' });
  res.json(bt.equity);
});


router.get('/:id/trades', async (req, res) => {
  const bt = await loadBacktest(req.params.id);
  if (!bt) return res.status(404).json({ error: 'not found' });
  res.json(bt.trades);
});

router.get('/:id/export/trades.csv', async (req, res) => {
  const bt = await loadBacktest(req.params.id);
  if (!bt) return res.status(404).json({ error: 'not found' });
  const header = 'id,t,side,qty,price,fee';
  const rows = bt.trades.map(t => `${t.id},${t.t},${t.side},${t.qty},${t.price},${t.fee}`);
  res.setHeader('Content-Type', 'text/csv');
  res.send([header, ...rows].join('\n'));
});

const BLANK_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAOjj0GAAAAAASUVORK5CYII=', 'base64');

router.get('/:id/export/equity.png', async (req, res) => {
  const bt = await loadBacktest(req.params.id);
  if (!bt) return res.status(404).json({ error: 'not found' });
  res.setHeader('Content-Type', 'image/png');
  res.send(BLANK_PNG);
});

module.exports = router;