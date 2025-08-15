const { fetchOHLC } = require('./exchanges/krakenClient');

async function runBacktest(params) {
  const fromMs = Date.parse(params.from);
  const toMs = Date.parse(params.to);
  const ohlc = await fetchOHLC(params.pair, params.timeframe, fromMs, toMs);
  const initial = params.initialCapital || 1000;
  let equity = initial;
  let maxEquity = equity;
  let maxDrawdown = 0;
  const points = [];
  const drawdown = [];
  const trades = [];
  const dailyMap = {};

  ohlc.forEach((candle, idx) => {
    const [ts, open, high, low, close] = candle;
    const dateISO = new Date(ts).toISOString();
    const side = close >= open ? 'LONG' : 'SHORT';
    const slippage = (params.slippageBps || 0) / 10000;
    const feeRate = (params.feeBps || 0) / 10000;
    const entry = open * (side === 'LONG' ? (1 + slippage) : (1 - slippage));
    const exit = close * (side === 'LONG' ? (1 - slippage) : (1 + slippage));
    const pnlGross = side === 'LONG' ? (exit - entry) : (entry - exit);
    const fee = (entry + exit) * feeRate;
    const pnl = pnlGross - fee;
    equity += pnl;

    points.push({ t: dateISO, equity: parseFloat(equity.toFixed(2)) });
    if (equity > maxEquity) maxEquity = equity;
    const dd = (equity - maxEquity) / maxEquity;
    if (dd < maxDrawdown) maxDrawdown = dd;
    drawdown.push({ t: dateISO, ddPct: parseFloat((dd * 100).toFixed(2)) });

    const day = dateISO.slice(0, 10);
    dailyMap[day] = (dailyMap[day] || 0) + pnl;

    trades.push({
      id: `tr_${idx}`,
      tEntry: dateISO,
      side,
      priceEntry: parseFloat(entry.toFixed(2)),
      qty: 1,
      fee: parseFloat(fee.toFixed(2)),
      tExit: dateISO,
      priceExit: parseFloat(exit.toFixed(2)),
      pnl: parseFloat(pnl.toFixed(2)),
      retPct: parseFloat(((pnl / initial) * 100).toFixed(2)),
      durationBars: 1,
      entryReason: 'bar',
      exitReason: 'bar'
    });
  });

  const days = Object.entries(dailyMap).map(([date, pnl]) => ({ date, pnl: parseFloat(pnl.toFixed(2)) }));
  const monthly = days.reduce((acc, d) => {
    const ym = d.date.slice(0, 7);
    acc[ym] = (acc[ym] || 0) + d.pnl;
    return acc;
  }, {});

  const wins = trades.filter(t => t.pnl >= 0);
  const losses = trades.filter(t => t.pnl < 0);
  const pnlValue = equity - initial;
  const pnlPct = (pnlValue / initial) * 100;
  const kpis = {
    currency: 'USD',
    pnlValue: parseFloat(pnlValue.toFixed(2)),
    pnlPct: parseFloat(pnlPct.toFixed(2)),
    trades: trades.length,
    winrate: trades.length ? parseFloat((wins.length / trades.length).toFixed(2)) : 0,
    maxDrawdownPct: parseFloat((maxDrawdown * 100).toFixed(2)),
    sharpe: 0,
    profitFactor: losses.reduce((s, t) => s + t.pnl, 0)
      ? parseFloat((wins.reduce((s, t) => s + t.pnl, 0) / Math.abs(losses.reduce((s, t) => s + t.pnl, 0))).toFixed(2))
      : 0,
    avgTradePct: trades.length ? parseFloat((pnlPct / trades.length).toFixed(2)) : 0,
    avgWinPct: wins.length ? parseFloat((wins.reduce((s, t) => s + t.retPct, 0) / wins.length).toFixed(2)) : 0,
    avgLossPct: losses.length ? parseFloat((losses.reduce((s, t) => s + t.retPct, 0) / losses.length).toFixed(2)) : 0,
    exposurePct: 100
  };

  return {
    id: `bt_${Date.now()}`,
    status: 'DONE',
    params,
    kpis,
    period: { from: params.from, to: params.to },
    createdAt: new Date().toISOString(),
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

module.exports = { runBacktest };