const registry = {
  EMA_CROSS: {
    label: "Croisement d'EMA",
    fields: [
      { key: 'fastWindow', type: 'integer', label: 'EMA rapide', min: 2, max: 200, default: 12, step: 1, required: true },
      { key: 'slowWindow', type: 'integer', label: 'EMA lente', min: 5, max: 400, default: 26, step: 1, required: true },
      { key: 'signalConfirmBars', type: 'integer', label: 'Barres de confirmation', min: 0, max: 5, default: 0 },
      { key: 'takeProfit', type: 'percent', label: 'Take Profit %', min: 0, max: 100, default: 2 },
      { key: 'stopLoss', type: 'percent', label: 'Stop Loss %', min: 0, max: 100, default: 1 },
      { key: 'trailingStop', type: 'percent', label: 'Trailing Stop % (0=off)', min: 0, max: 100, default: 0 },
      { key: 'tradeSide', type: 'enum', label: 'Côté de trade', values: ['LONG', 'SHORT', 'BOTH'], default: 'BOTH' }
    ],
    constraints: [
      {
        message: 'EMA rapide doit être < EMA lente',
        test: (p) => p.fastWindow < p.slowWindow
      }
    ],
    overlays: ['emaFast', 'emaSlow']
  },
  RSI: {
    label: 'RSI',
    fields: [
      { key: 'rsiPeriod', type: 'integer', label: 'RSI période', min: 2, max: 100, default: 14, step: 1, required: true },
      { key: 'overbought', type: 'integer', label: 'Seuil surachat', min: 50, max: 100, default: 70, step: 1, required: true },
      { key: 'oversold', type: 'integer', label: 'Seuil survente', min: 0, max: 50, default: 30, step: 1, required: true },
      { key: 'enterOnCross', type: 'boolean', label: 'Entrer sur franchissement des seuils', default: true },
      { key: 'exitOnMidline', type: 'boolean', label: 'Sortir sur croisement de 50', default: true },
      { key: 'tp', type: 'percent', label: 'Take Profit %', min: 0, max: 100, default: 2 },
      { key: 'sl', type: 'percent', label: 'Stop Loss %', min: 0, max: 100, default: 1 },
      { key: 'holdBars', type: 'integer', label: 'Maintien minimum (barres)', min: 0, max: 500, default: 0 },
      { key: 'cooldown', type: 'integer', label: 'Cooldown après sortie (barres)', min: 0, max: 500, default: 0 },
      { key: 'tradeSide', type: 'enum', label: 'Côté de trade', values: ['LONG', 'SHORT', 'BOTH'], default: 'BOTH' }
    ],
    constraints: [
      {
        message: 'Le seuil de survente doit être < au seuil de surachat',
        test: (p) => p.oversold < p.overbought
      }
    ],
    overlays: ['rsi']
  },
  BB: {
    label: 'Bandes de Bollinger',
    fields: [
      { key: 'bbPeriod', type: 'integer', label: 'Période Bollinger', min: 5, max: 200, default: 20, step: 1, required: true },
      { key: 'bbStdDev', type: 'number', label: "Écart-type", min: 0.5, max: 4, default: 2, step: 0.1, required: true },
      { key: 'entryMode', type: 'enum', label: "Mode d'entrée", values: ['MeanRevert', 'Breakout'], default: 'MeanRevert' },
      { key: 'confirmBars', type: 'integer', label: 'Barres de confirmation', min: 0, max: 5, default: 0 },
      { key: 'tp', type: 'percent', label: 'Take Profit %', min: 0, max: 100, default: 2 },
      { key: 'sl', type: 'percent', label: 'Stop Loss %', min: 0, max: 100, default: 1 },
      { key: 'trailingStop', type: 'percent', label: 'Trailing Stop % (0=off)', min: 0, max: 100, default: 0 },
      { key: 'tradeSide', type: 'enum', label: 'Côté de trade', values: ['LONG', 'SHORT', 'BOTH'], default: 'BOTH' }
    ],
    constraints: [],
    overlays: ['bbUpper', 'bbMiddle', 'bbLower']
  },
  ADX_TREND: {
    label: 'Tendance ADX',
    fields: [
      { key: 'adxPeriod', type: 'integer', label: 'ADX période', min: 5, max: 50, default: 14, step: 1, required: true },
      { key: 'adxThreshold', type: 'number', label: 'Seuil ADX (force de tendance)', min: 5, max: 60, default: 20, step: 0.5, required: true },
      { key: 'useDICross', type: 'boolean', label: 'Utiliser croisement DI+ / DI-', default: true },
      { key: 'diBuffer', type: 'number', label: 'Marge entre DI+ et DI- (points)', min: 0, max: 10, default: 0, step: 0.1 },
      { key: 'trendFilterEMA', type: 'integer', label: 'Filtre EMA (0=off)', min: 0, max: 400, default: 0, step: 1 },
      { key: 'takeProfit', type: 'percent', label: 'Take Profit %', min: 0, max: 100, default: 2 },
      { key: 'stopLoss', type: 'percent', label: 'Stop Loss %', min: 0, max: 100, default: 1.5 },
      { key: 'trailingStop', type: 'percent', label: 'Trailing Stop % (0=off)', min: 0, max: 100, default: 0 },
      { key: 'cooldown', type: 'integer', label: 'Cooldown (barres)', min: 0, max: 500, default: 0 },
      { key: 'tradeSide', type: 'enum', label: 'Côté de trade', values: ['LONG', 'SHORT', 'BOTH'], default: 'BOTH' }
    ],
    constraints: [
      {
        message: 'Seuil ADX recommandé entre 5 et 60',
        test: (p) => p.adxThreshold >= 5 && p.adxThreshold <= 60
      }
    ],
    overlays: ['adx', 'diPlus', 'diMinus']
  }
};

function listKinds() {
  return Object.entries(registry).map(([kind, def]) => ({
    kind,
    label: def.label,
    fields: def.fields,
    constraints: def.constraints,
  }));
}

function getSchema(kind) {
  return registry[kind];
}

function validate(kind, params) {
  const schema = registry[kind];
  if (!schema) return { ok: false, errors: { kind: 'UNKNOWN_KIND' } };
  const errors = {};
  for (const field of schema.fields) {
    const value = params[field.key];
    if (value === undefined || value === null) {
      if (field.required) errors[field.key] = 'required';
      continue;
    }
    if (field.type === 'integer' && !Number.isInteger(value)) {
      errors[field.key] = 'must be integer';
      continue;
    }
    if (field.type === 'number' && typeof value !== 'number') {
      errors[field.key] = 'must be number';
      continue;
    }
    if (field.type === 'percent' && (typeof value !== 'number' || value < field.min || value > field.max)) {
      errors[field.key] = `must be between ${field.min} and ${field.max}`;
      continue;
    }
    if ((field.type === 'integer' || field.type === 'number') && typeof value === 'number') {
      if (field.min !== undefined && value < field.min) errors[field.key] = `min ${field.min}`;
      if (field.max !== undefined && value > field.max) errors[field.key] = `max ${field.max}`;
    }
    if (field.type === 'enum' && !field.values.includes(value)) {
      errors[field.key] = 'invalid value';
    }
    if (field.type === 'boolean' && typeof value !== 'boolean') {
      errors[field.key] = 'must be boolean';
    }
  }
  for (const c of schema.constraints || []) {
    if (!c.test(params)) {
      errors._rule = c.message;
    }
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

function generateOHLCV(limit = 200) {
  const data = [];
  const start = Date.now() - limit * 60 * 1000;
  let price = 100;
  for (let i = 0; i < limit; i++) {
    const t = start + i * 60 * 1000;
    const open = price;
    price = price + Math.sin(i / 5);
    const close = price;
    const high = Math.max(open, close) + 1;
    const low = Math.min(open, close) - 1;
    const volume = 1000 + i;
    data.push([t, open, high, low, close, volume]);
  }
  return data;
}

function preview(kind, params, opts = {}) {
  const limit = opts.limit || 200;
  const ohlcv = generateOHLCV(limit);
  const schema = registry[kind];
  const overlays = {};
  if (schema && schema.overlays) {
    for (const ov of schema.overlays) {
      overlays[ov] = ohlcv.map(c => c[4]);
    }
  }
  const signals = ohlcv.slice(0, 2).map((c, idx) => ({ t: c[0], type: idx % 2 === 0 ? 'ENTRY' : 'EXIT', price: c[4] }));
  return { ohlcv, overlays, signals };
}

module.exports = { listKinds, getSchema, validate, preview };