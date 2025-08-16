import { z } from 'zod';
import { adxEmaRsiSignals, Candle, Signal, AdxEmaRsiParams } from './adxEmaRsi';

export type StrategyTemplate = {
  key: 'adxEmaRsi';
  paramsSchema: z.ZodSchema<AdxEmaRsiParams>;
  runOnCandles: (candles: Candle[], p: AdxEmaRsiParams) => Signal[];
};

const adxEmaRsiSchema = z.object({
  timeframeBase: z.literal('1D'),
  pollIntervalMin: z.number().default(5),
  emaShort: z.number().default(20),
  emaLong: z.number().default(50),
  rsiLen: z.number().default(14),
  adxLen: z.number().default(14),
  adxTrendThreshold: z.number().default(20),
  signalConfirmation: z.enum(['dailyClose', 'intradayCross']).default('dailyClose'),
});

const adxEmaRsiTemplate: StrategyTemplate = {
  key: 'adxEmaRsi',
  paramsSchema: adxEmaRsiSchema,
  runOnCandles: adxEmaRsiSignals,
};

const templates: StrategyTemplate[] = [];
if (process.env.ADX_EMA_RSI_ENABLED === 'true') {
  templates.push(adxEmaRsiTemplate);
}

export function listTemplates() {
  return templates.slice();
}

export function getTemplate(key: string) {
  return templates.find(t => t.key === key);
}

export type { Candle, Signal, AdxEmaRsiParams };