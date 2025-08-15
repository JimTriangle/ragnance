function maxDrawdown(equity) {
  let peak = equity[0];
  let maxDd = 0;
  for (const val of equity) {
    if (val > peak) peak = val;
    const dd = (val - peak) / peak;
    if (dd < maxDd) maxDd = dd;
  }
  return Math.abs(maxDd * 100);
}

function pairTrades(trades) {
  const pairs = [];
  for (let i = 0; i < trades.length; i += 2) {
    const buy = trades[i];
    const sell = trades[i + 1];
    if (buy && sell) {
      pairs.push({ pnl: (sell.price - buy.price) * buy.qty - buy.fee - sell.fee });
    }
  }
  return pairs;
}

function computeKpis(equity, trades) {
  const start = equity[0];
  const end = equity[equity.length - 1];
  const pnl = end - start;
  const pnlPct = (pnl / start) * 100;
  const maxDD = maxDrawdown(equity);
  const roundTrips = pairTrades(trades);
  const wins = roundTrips.filter(t => t.pnl > 0).length;
  const winrate = roundTrips.length ? (wins / roundTrips.length) * 100 : 0;
  return { pnl, pnlPct, maxDD, winrate, tradesCount: trades.length };
}

function fillDrawdown(points) {
  let peak = points.length ? points[0].equity : 0;
  for (const p of points) {
    if (p.equity > peak) peak = p.equity;
    p.drawdown = peak ? (p.equity - peak) / peak * 100 : 0;
  }
}

module.exports = { computeKpis, fillDrawdown };