import { ema } from '../indicators/ema';
import { rsi } from '../indicators/rsi';
import { adxFromCandles, Candle as AdxCandle } from '../indicators/adx';

export type Candle = AdxCandle & { t: number; o: number; c: number; v?: number };
export type SignalType = 'ENTRY_LONG' | 'ENTRY_SHORT' | 'EXIT_LONG' | 'EXIT_SHORT';
export type Signal = { t: number; type: SignalType };
export type AdxEmaRsiParams = {
  timeframeBase: '1D';
  pollIntervalMin: number;
  emaShort: number;
  emaLong: number;
  rsiLen: number;
  adxLen: number;
  adxTrendThreshold: number;
  signalConfirmation: 'dailyClose' | 'intradayCross';
};

export function adxEmaRsiSignals(daily: Candle[], p: AdxEmaRsiParams): Signal[] {
  const closes = daily.map(c => c.c);
  const emaS = ema(closes, p.emaShort);
  const emaL = ema(closes, p.emaLong);
  const rsiV = rsi(closes, p.rsiLen);
  const { adx } = adxFromCandles(daily, p.adxLen);

  const sig: Signal[] = [];
  for (let i = 1; i < daily.length; i++) {
    const crossUp = emaS[i - 1] <= emaL[i - 1] && emaS[i] > emaL[i];
    const crossDown = emaS[i - 1] >= emaL[i - 1] && emaS[i] < emaL[i];
    const condUp = crossUp && rsiV[i] > 50 && adx[i] > p.adxTrendThreshold;
    const condDown = crossDown && rsiV[i] < 50 && adx[i] > p.adxTrendThreshold;
    const finUp = rsiV[i - 1] >= 50 && rsiV[i] < 50 && emaS[i] < emaL[i];
    const finDown = rsiV[i - 1] <= 50 && rsiV[i] > 50 && emaS[i] > emaL[i];
    if (condUp) sig.push({ t: daily[i].t, type: 'ENTRY_LONG' });
    if (condDown) sig.push({ t: daily[i].t, type: 'ENTRY_SHORT' });
    if (finUp) sig.push({ t: daily[i].t, type: 'EXIT_LONG' });
    if (finDown) sig.push({ t: daily[i].t, type: 'EXIT_SHORT' });
  }
  return sig;
}