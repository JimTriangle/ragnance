export type Candle = { h: number; l: number; c: number };

function rma(values: number[], length: number): number[] {
  const result: number[] = [];
  let prev: number | undefined;
  const alpha = 1 / length;
  for (const v of values) {
    prev = prev === undefined ? v : alpha * v + (1 - alpha) * prev;
    result.push(prev);
  }
  return result;
}

export function adxFromCandles(candles: Candle[], length: number) {
  const tr: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const cur = candles[i];
    const prev = candles[i - 1];
    tr[i] = Math.max(
      cur.h - cur.l,
      Math.max(Math.abs(cur.h - prev.c), Math.abs(cur.l - prev.c))
    );
    const upMove = cur.h - prev.h;
    const downMove = prev.l - cur.l;
    plusDM[i] = upMove > downMove && upMove > 0 ? upMove : 0;
    minusDM[i] = downMove > upMove && downMove > 0 ? downMove : 0;
  }
  const smoothedTR = rma(tr, length);
  const smoothedPlusDM = rma(plusDM, length);
  const smoothedMinusDM = rma(minusDM, length);
  const plusDI = smoothedPlusDM.map((v, i) => (v / smoothedTR[i]) * 100);
  const minusDI = smoothedMinusDM.map((v, i) => (v / smoothedTR[i]) * 100);
  const dx = plusDI.map((p, i) => Math.abs(p - minusDI[i]) / (p + minusDI[i]) * 100);
  const adx = rma(dx, length);
  return { adx, plusDI, minusDI };
}