// Skeleton watcher running every 5 minutes for ADX/EMA/RSI strategy
// This does not implement real scheduling or exchange access; it only sketches
// the expected flow as described in the specification.

import { adxEmaRsiSignals, AdxEmaRsiParams, Candle } from '../strategies/adxEmaRsi';

type StrategyInstance = {
  id: string;
  symbol: string;
  params: AdxEmaRsiParams;
};

type WatcherDeps = {
  ohlc: (tf: string, symbol: string, since: number) => Promise<Candle[]>;
  loadDailyHistory: (symbol: string, lookback: number) => Promise<Candle[]>;
  mergeDailyWith: (m5: Candle[], day: Candle[]) => Candle[];
  recordSignal: (instId: string, signal: any, meta: any) => void;
};

export async function runWatcher(instances: StrategyInstance[], deps: WatcherDeps) {
  for (const inst of instances) {
    const m5 = await deps.ohlc('5m', inst.symbol, Date.now());
    const day = await deps.loadDailyHistory(inst.symbol, 400);
    const dayWithCurrent = deps.mergeDailyWith(m5, day);
    const signals = adxEmaRsiSignals(dayWithCurrent, inst.params);
    if (signals.length) {
      deps.recordSignal(inst.id, signals[signals.length - 1], {});
    }
  }
}