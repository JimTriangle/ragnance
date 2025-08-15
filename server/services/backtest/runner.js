const fs = require('fs/promises');
const crypto = require("crypto");
const path = require('path');
const { KrakenClient } = require('../kraken/client');
const { smaCross } = require('./strategies/smaCross');
const { computeKpis, fillDrawdown } = require('./metrics');

const DATA_PATH = path.join(__dirname, '..', '..', '.data', 'backtests.json');

function uid() {
  return 'bt_' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36));
}

async function readJsonArray(file) {
  try {
    const txt = await fs.readFile(file, 'utf8');
    return JSON.parse(txt);
  } catch (e) {
    return [];
  }
}

async function persistResult(bt) {
  const arr = await readJsonArray(DATA_PATH);
  const idx = arr.findIndex(x => x.id === bt.id);
  if (idx >= 0) arr[idx] = bt; else arr.push(bt);
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH + '.tmp', JSON.stringify(arr, null, 2));
  await fs.rename(DATA_PATH + '.tmp', DATA_PATH);
}

async function loadBacktest(id) {
  const arr = await readJsonArray(DATA_PATH);
  return arr.find(x => x.id === id) || null;
}

async function fetchAllOHLC(kc, pair, interval, from, to) {
  let since = Math.floor(from / 1000);
  const candles = [];
  while (true) {
    const res = await kc.ohlc(pair, interval, since);
    const list = res.result && Object.values(res.result)[0];
    if (!Array.isArray(list)) break;
    for (const c of list) {
      const t = c[0] * 1000;
      if (t < from) continue;
      if (t > to) return candles;
      candles.push({ t, o: +c[1], h: +c[2], l: +c[3], c: +c[4], v: +c[6] });
      since = c[0] + 1;
    }
    if (list.length === 0) break;
    if (candles.length && candles[candles.length - 1].t >= to) break;
  }
  return candles;
}

function rsiRevert(candles) {
  return candles.map(c => ({ t: c.t, signal: 'HOLD' }));
}

async function runBacktest(p) {
  const kc = new KrakenClient();
  const candles = await fetchAllOHLC(kc, p.pair, p.timeframe, p.from, p.to);
  const signals = p.strategy === 'smaCross' ? smaCross(candles) : rsiRevert(candles);
  let cash = p.initialCash;
  let posQty = 0;
  let lastPrice = 0;
  const trades = [];
  const equity = [];
  for (let i = 0; i < candles.length; i++) {
    const { t, c: price } = candles[i];
    const s = signals[i].signal;
    const execPrice = price * (1 + (s === 'BUY' ? +p.slippagePct : -p.slippagePct));
    if (s === 'BUY' && cash > 0) {
      const qty = +(cash / execPrice).toFixed(8);
      const fee = execPrice * qty * p.feePct;
      trades.push({ id: uid(), t, side: 'BUY', qty, price: execPrice, fee });
      posQty += qty; cash = 0; lastPrice = execPrice;
    }
    if (s === 'SELL' && posQty > 0) {
      const proceeds = execPrice * posQty;
      const fee = proceeds * p.feePct;
      trades.push({ id: uid(), t, side: 'SELL', qty: posQty, price: execPrice, fee });
      cash += proceeds - fee; posQty = 0; lastPrice = execPrice;
    }
    const eq = cash + posQty * price;
    equity.push({ t, equity: eq, drawdown: 0 });
  }
  const kpis = computeKpis(equity.map(e => e.equity), trades);
  fillDrawdown(equity);
  const result = { id: uid(), params: p, kpis, trades, equity, createdAt: Date.now() };
  await persistResult(result);
  return result;
}

module.exports = { runBacktest, loadBacktest };