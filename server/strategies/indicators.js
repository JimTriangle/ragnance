const undefinedVal = undefined;

function SMA(src, length) {
  const out = new Array(src.length).fill(undefinedVal);
  if (!length) return out;
  let sum = 0;
  for (let i = 0; i < src.length; i++) {
    const v = src[i];
    sum += v;
    if (i >= length) {
      sum -= src[i - length];
    }
    if (i >= length - 1) {
      out[i] = sum / length;
    }
  }
  return out;
}

function EMA(src, length) {
  const out = new Array(src.length).fill(undefinedVal);
  if (!length) return out;
  const k = 2 / (length + 1);
  let ema = 0;
  for (let i = 0; i < src.length; i++) {
    const v = src[i];
    if (i === 0) {
      ema = v;
    } else {
      ema = v * k + ema * (1 - k);
    }
    if (i >= length - 1) {
      out[i] = ema;
    }
  }
  return out;
}

function RMA(src, length) {
  const out = new Array(src.length).fill(undefinedVal);
  if (!length) return out;
  let rma = 0;
  for (let i = 0; i < src.length; i++) {
    const v = src[i];
    if (i === 0) {
      rma = v;
    } else {
      rma = (rma * (length - 1) + v) / length;
    }
    if (i >= length - 1) {
      out[i] = rma;
    }
  }
  return out;
}

function RSI(src, length) {
  const out = new Array(src.length).fill(undefinedVal);
  const gains = new Array(src.length).fill(0);
  const losses = new Array(src.length).fill(0);
  for (let i = 1; i < src.length; i++) {
    const change = src[i] - src[i - 1];
    gains[i] = change > 0 ? change : 0;
    losses[i] = change < 0 ? -change : 0;
  }
  const avgGain = RMA(gains, length);
  const avgLoss = RMA(losses, length);
  for (let i = 0; i < src.length; i++) {
    const ag = avgGain[i];
    const al = avgLoss[i];
    if (ag === undefinedVal || al === undefinedVal) continue;
    const rs = al === 0 ? 100 : ag / al;
    out[i] = 100 - 100 / (1 + rs);
  }
  return out;
}

function Bollinger(src, length, stdDev) {
  const middle = SMA(src, length);
  const upper = new Array(src.length).fill(undefinedVal);
  const lower = new Array(src.length).fill(undefinedVal);
  for (let i = 0; i < src.length; i++) {
    if (i >= length - 1) {
      const mean = middle[i];
      let variance = 0;
      for (let j = i - length + 1; j <= i; j++) {
        const diff = src[j] - mean;
        variance += diff * diff;
      }
      const stdev = Math.sqrt(variance / length);
      upper[i] = mean + stdev * stdDev;
      lower[i] = mean - stdev * stdDev;
    }
  }
  return { upper, middle, lower };
}

function ADX(high, low, close, length) {
  const tr = new Array(high.length).fill(undefinedVal);
  const plusDM = new Array(high.length).fill(0);
  const minusDM = new Array(high.length).fill(0);
  for (let i = 1; i < high.length; i++) {
    const upMove = high[i] - high[i - 1];
    const downMove = low[i - 1] - low[i];
    plusDM[i] = (upMove > downMove && upMove > 0) ? upMove : 0;
    minusDM[i] = (downMove > upMove && downMove > 0) ? downMove : 0;
    const range1 = high[i] - low[i];
    const range2 = Math.abs(high[i] - close[i - 1]);
    const range3 = Math.abs(low[i] - close[i - 1]);
    tr[i] = Math.max(range1, range2, range3);
  }
  const atr = RMA(tr, length);
  const plus = RMA(plusDM, length);
  const minus = RMA(minusDM, length);
  const plusDI = new Array(high.length).fill(undefinedVal);
  const minusDI = new Array(high.length).fill(undefinedVal);
  const dx = new Array(high.length).fill(undefinedVal);
  for (let i = 0; i < high.length; i++) {
    const a = atr[i];
    if (a === undefinedVal || a === 0) continue;
    const p = plus[i] * 100 / a;
    const m = minus[i] * 100 / a;
    plusDI[i] = p;
    minusDI[i] = m;
    const d = p + m;
    dx[i] = d === 0 ? 0 : Math.abs(p - m) * 100 / d;
  }
  const adx = RMA(dx, length);
  return { adx, plusDI, minusDI };
}

module.exports = { EMA, SMA, RMA, RSI, Bollinger, ADX };