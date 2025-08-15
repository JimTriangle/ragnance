const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const DATA_DIR = path.join(__dirname, '../.data');
const DATA_FILE = path.join(DATA_DIR, 'backtests.json');
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const { runBacktest } = require('../services/backtestEngine');

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
  }
}

function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function writeStore(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

ensureStore();

router.get('/', (req, res) => {
  const data = readStore();
  const items = data.map(b => ({
    id: b.id,
    status: b.status,
    pair: b.params.pair,
    timeframe: b.params.timeframe,
    pnlPct: b.kpis.pnlPct,
    period: b.period,
    createdAt: b.createdAt
  }));
  res.json({ items, page: 1, pageSize: items.length, total: items.length });
});

router.post('/', async (req, res) => {
  const body = req.body || {};
  if (!body.strategyId || !body.exchange || !body.pair || !body.timeframe || !body.from || !body.to) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Missing fields' } });
  }
  try {
    const bt = await runBacktest(body);
    const data = readStore();
    data.push(bt);
    writeStore(data);
    res.status(201).json({ id: bt.id, status: bt.status });
  } catch (err) {
    res.status(500).json({ error: { code: 'BACKTEST_FAILED', message: err.message } });
  }
});

router.get('/:id', (req, res) => {
  const data = readStore();
  const bt = data.find(b => b.id === req.params.id);
  if (!bt) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Backtest not found' } });
  res.json({
    id: bt.id,
    status: bt.status,
    params: bt.params,
    kpis: bt.kpis,
    period: bt.period,
    createdAt: bt.createdAt,
    endedAt: bt.endedAt
  });
});

router.get('/:id/equity', (req, res) => {
  const bt = readStore().find(b => b.id === req.params.id);
  if (!bt) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Backtest not found' } });
  res.json({ points: bt.equity, drawdown: bt.drawdown });
});

router.get('/:id/pnl-daily', (req, res) => {
  const bt = readStore().find(b => b.id === req.params.id);
  if (!bt) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Backtest not found' } });
  res.json(bt.pnlDaily);
});

router.get('/:id/trades', (req, res) => {
  const bt = readStore().find(b => b.id === req.params.id);
  if (!bt) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Backtest not found' } });
  res.json({ items: bt.trades });
});

router.get('/:id/export/trades.csv', (req, res) => {
  const bt = readStore().find(b => b.id === req.params.id);
  if (!bt) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Backtest not found' } });
  const header = 'id,tEntry,side,priceEntry,qty,fee,tExit,priceExit,pnl,retPct';
  const rows = bt.trades.map(t => `${t.id},${t.tEntry},${t.side},${t.priceEntry},${t.qty},${t.fee},${t.tExit},${t.priceExit},${t.pnl},${t.retPct}`);
  res.set('Content-Type', 'text/csv');
  res.send([header, ...rows].join('\n'));
});

const BLANK_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAOjj0GAAAAAASUVORK5CYII=',
  'base64'
);

router.get('/:id/export/equity.png', (req, res) => {
  const bt = readStore().find(b => b.id === req.params.id);
  if (!bt) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Backtest not found' } });
  res.set('Content-Type', 'image/png');
  res.send(BLANK_PNG);
});

module.exports = router;