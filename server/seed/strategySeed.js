const Strategy = require('../models/Strategy.model');

module.exports = async () => {
  const count = await Strategy.count();
  if (count > 0) return;
  await Strategy.bulkCreate([
    {
      id: 'st_seed_ema',
      userId: '1',
      name: 'EMA rapide',
      kind: 'EMA_CROSS',
      params: { fastWindow: 12, slowWindow: 26, signalConfirmBars: 0, takeProfit: 2, stopLoss: 1 },
      backtestsCount: 1,
    },
    {
      id: 'st_seed_rsi',
      userId: '1',
      name: 'RSI basique',
      kind: 'RSI',
      params: { rsiPeriod: 14, overbought: 70, oversold: 30, enterOnCross: true, exitOnMidline: true, tp: 2, sl: 1 },
      backtestsCount: 1,
    },
    {
      id: 'st_seed_bb',
      userId: '1',
      name: 'BB démo',
      kind: 'BB',
      params: { bbPeriod: 20, bbStdDev: 2, entryMode: 'MeanRevert', tp: 2, sl: 1 },
      backtestsCount: 1,
    },
    {
      id: 'st_seed_adx',
      userId: '1',
      name: 'ADX trend',
      kind: 'ADX_TREND',
      params: { adxPeriod: 14, adxThreshold: 20, useDICross: true, takeProfit: 2, stopLoss: 1.5 },
      backtestsCount: 1,
    },
  ]);
};