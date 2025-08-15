const express = require('express');
const router = express.Router();

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function createSeeder(seed) {
  return function () {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
}

function parseRange(req, res) {
  const now = new Date();
  const to = req.query.to ? new Date(req.query.to) : now;
  const from = req.query.from ? new Date(req.query.from) : new Date(to.getTime() - 29 * MS_PER_DAY);

  if (isNaN(from) || isNaN(to) || to < from) {
    res.status(400).json({ error: { code: 'INVALID_RANGE', message: 'Invalid from/to' } });
    return null;
  }
  if (to - from > 180 * MS_PER_DAY) {
    res.status(400).json({ error: { code: 'RANGE_TOO_LARGE', message: 'Range cannot exceed 180 days' } });
    return null;
  }
  return { from, to };
}

function generateMockData(from, to) {
  const daysCount = Math.floor((to - from) / MS_PER_DAY) + 1;
  const rnd = createSeeder(42);
  let equity = 10000;
  let maxEquity = equity;
  let maxDrawdown = 0;
  let positiveDays = 0;
  let tradesCount = 0;
  const points = [];
  const days = [];

  for (let i = 0; i < daysCount; i++) {
    const date = new Date(from.getTime() + i * MS_PER_DAY);
    const change = (rnd() - 0.5) * 200; // deterministic variation
    equity += change;
    points.push({ t: date.toISOString(), equity: parseFloat(equity.toFixed(2)) });
    days.push({ date: date.toISOString().slice(0, 10), pnl: parseFloat(change.toFixed(2)) });
    if (equity > maxEquity) maxEquity = equity;
    const dd = (equity - maxEquity) / maxEquity;
    if (dd < maxDrawdown) maxDrawdown = dd;
    if (change > 0) positiveDays++;
    tradesCount += Math.floor(rnd() * 5) + 1; // 1..5 trades per day
  }

  const pnlTotal = parseFloat(days.reduce((s, d) => s + d.pnl, 0).toFixed(2));
  const pnlDay = days[days.length - 1]?.pnl || 0;
  const pnlWeek = parseFloat(days.slice(-7).reduce((s, d) => s + d.pnl, 0).toFixed(2));
  const pnlMonth = parseFloat(days.slice(-30).reduce((s, d) => s + d.pnl, 0).toFixed(2));

  return {
    equityCurrent: parseFloat(equity.toFixed(2)),
    pnlDay,
    pnlWeek,
    pnlMonth,
    pnlTotal,
    maxDrawdown: parseFloat((maxDrawdown * 100).toFixed(2)),
    winrate: days.length ? parseFloat((positiveDays / days.length).toFixed(2)) : 0,
    tradesCount,
    points,
    days,
  };
}

router.get('/summary', (req, res) => {
  const range = parseRange(req, res);
  if (!range) return;
  const data = generateMockData(range.from, range.to);

  res.json({
    range: { from: range.from.toISOString(), to: range.to.toISOString() },
    currency: 'USDT',
    equity: { current: data.equityCurrent },
    pnl: { day: data.pnlDay, week: data.pnlWeek, month: data.pnlMonth, total: data.pnlTotal },
    maxDrawdown: data.maxDrawdown,
    winrate: data.winrate,
    tradesCount: data.tradesCount,
    robots: [
      {
        id: 'r1',
        name: 'Bot A',
        status: 'RUNNING',
        pnl24h: parseFloat((data.pnlDay / 2).toFixed(2)),
        pnlTotal: parseFloat((data.pnlTotal / 2).toFixed(2)),
        sharpe: 1.2,
        lastEventAt: range.to.toISOString(),
      },
      {
        id: 'r2',
        name: 'Bot B',
        status: 'STOPPED',
        pnl24h: 0,
        pnlTotal: -12.34,
        sharpe: -0.5,
        lastEventAt: new Date(range.to.getTime() - 3 * MS_PER_DAY).toISOString(),
      },
    ],
    backtests: [
      {
        id: 'b1',
        strategy: 'EMA_CROSS',
        pair: 'BTC/USDT',
        pnlTotal: parseFloat((data.pnlTotal / 3).toFixed(2)),
        sharpe: 0.8,
        endedAt: range.from.toISOString(),
      },
    ],
  });
});

router.get('/equity-curve', (req, res) => {
  const range = parseRange(req, res);
  if (!range) return;
  const data = generateMockData(range.from, range.to);
  res.json({ points: data.points });
});

router.get('/pnl-daily', (req, res) => {
  const range = parseRange(req, res);
  if (!range) return;
  const data = generateMockData(range.from, range.to);
  res.json({ days: data.days });
});

module.exports = router;