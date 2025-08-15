function sma(values, n) {
  const out = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= n) sum -= values[i - n];
    out[i] = i >= n - 1 ? sum / n : NaN;
  }
  return out;
}

function smaCross(candles) {
  const close = candles.map(c => c.c);
  const fast = sma(close, 9);
  const slow = sma(close, 21);
  return candles.map((c, i) => {
    const prev = i > 0 ? fast[i - 1] - slow[i - 1] : NaN;
    const now = fast[i] - slow[i];
    if (!Number.isFinite(prev) || !Number.isFinite(now)) {
      return { t: c.t, signal: 'HOLD' };
    }
    if (prev <= 0 && now > 0) return { t: c.t, signal: 'BUY' };
    if (prev >= 0 && now < 0) return { t: c.t, signal: 'SELL' };
    return { t: c.t, signal: 'HOLD' };
  });
}

module.exports = { sma, smaCross };