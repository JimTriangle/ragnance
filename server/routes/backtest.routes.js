const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const DATA_DIR = path.join(__dirname, '../.data');
const DATA_FILE = path.join(DATA_DIR, 'backtests.json');
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const sample = generateSample();
    fs.writeFileSync(DATA_FILE, JSON.stringify([sample], null, 2));
  }
}

function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function writeStore(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateMockBacktest(params, seed = Date.now()) {
  const id = `bt_${seed}`;
  const createdAt = new Date().toISOString();
  const from = new Date(params.from);
  const to = new Date(params.to);
  const daysCount = Math.max(1, Math.floor((to - from) / MS_PER_DAY) + 1);

  let equity = params.initialCapital || 1000;
  let maxEquity = equity;
  let maxDrawdown = 0;
  const points = [];
  const drawdown = [];
  const days = [];
  const trades = [];

  for (let i = 0; i < daysCount; i++) {
    const date = new Date(from.getTime() + i * MS_PER_DAY);
    const change = (seededRandom(seed + i) - 0.5) * equity * 0.02; // +/-2%
    equity += change;
    points.push({ t: date.toISOString(), equity: parseFloat(equity.toFixed(2)) });
    if (equity > maxEquity) maxEquity = equity;
    const dd = (equity - maxEquity) / maxEquity;
    if (dd < maxDrawdown) maxDrawdown = dd;
    drawdown.push({ t: date.toISOString(), ddPct: parseFloat((dd * 100).toFixed(2)) });
    days.push({ date: date.toISOString().slice(0, 10), pnl: parseFloat(change.toFixed(2)) });
    trades.push({
      id: `tr_${i}`,
      tEntry: date.toISOString(),
      side: change >= 0 ? 'LONG' : 'SHORT',
      priceEntry: 100 + i,
      qty: 1,
      fee: 0.1,
      tExit: date.toISOString(),
      priceExit: 100 + i + 1,
      pnl: parseFloat(change.toFixed(2)),
      retPct: parseFloat(((change / (params.initialCapital || 1000)) * 100).toFixed(2)),
      durationBars: 1,
      entryReason: 'mock',
      exitReason: 'mock'
    });
  }

  const pnlValue = equity - (params.initialCapital || 1000);
  const pnlPct = (pnlValue / (params.initialCapital || 1000)) * 100;
  const wins = trades.filter(t => t.pnl >= 0);
  const losses = trades.filter(t => t.pnl < 0);

  const monthly = days.reduce((acc, d) => {
    const ym = d.date.slice(0, 7);
    acc[ym] = (acc[ym] || 0) + d.pnl;
    return acc;
  }, {});

  const kpis = {
    currency: 'USDT',
    pnlValue: parseFloat(pnlValue.toFixed(2)),
    pnlPct: parseFloat(pnlPct.toFixed(2)),
    trades: trades.length,
    winrate: trades.length ? parseFloat((wins.length / trades.length).toFixed(2)) : 0,
    maxDrawdownPct: parseFloat((maxDrawdown * 100).toFixed(2)),
    sharpe: 0,
    profitFactor: losses.reduce((s, t) => s + t.pnl, 0) ?
      parseFloat((wins.reduce((s, t) => s + t.pnl, 0) / Math.abs(losses.reduce((s, t) => s + t.pnl, 0))).toFixed(2)) : 0,
    avgTradePct: trades.length ? parseFloat((pnlPct / trades.length).toFixed(2)) : 0,
    avgWinPct: wins.length ? parseFloat((wins.reduce((s, t) => s + t.retPct, 0) / wins.length).toFixed(2)) : 0,
    avgLossPct: losses.length ? parseFloat((losses.reduce((s, t) => s + t.retPct, 0) / losses.length).toFixed(2)) : 0,
    exposurePct: 100
  };

  return {
    id,
    status: 'DONE',
    params,
    kpis,
    period: { from: params.from, to: params.to },
    createdAt,
    endedAt: new Date().toISOString(),
    equity: points,
    drawdown,
    pnlDaily: {
      days,
      monthly: Object.entries(monthly).map(([ym, pnl]) => ({ ym, pnl: parseFloat(pnl.toFixed(2)) }))
    },
    trades
  };
}

function generateSample() {
  const now = new Date();
  const from = new Date(now.getTime() - 30 * MS_PER_DAY);
  const params = {
    strategyId: 'EMA_CROSS',
    exchange: 'BINANCE',
    pair: 'BTC/USDT',
    timeframe: '1h',
    from: from.toISOString(),
    to: now.toISOString(),
    initialCapital: 1000,
    feeBps: 10,
    slippageBps: 5,
    positionSizing: { mode: 'FixedFraction', riskPctPerTrade: 1 },
    rules: { allowShort: false, orderType: 'market', limitOffsetBps: 0, maxConcurrentPositions: 1 },
    split: { enabled: false, ratio: 0.8 }
  };
  return generateMockBacktest(params, 1);
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

router.post('/', (req, res) => {
  const body = req.body || {};
  if (!body.strategyId || !body.exchange || !body.pair || !body.timeframe || !body.from || !body.to) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Missing fields' } });
  }
  const bt = generateMockBacktest(body, Date.now());
  const data = readStore();
  data.push(bt);
  writeStore(data);
  res.status(201).json({ id: bt.id, status: bt.status });
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