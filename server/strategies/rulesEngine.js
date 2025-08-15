const indicators = require('./indicators');

function getSeriesFromSource(ohlcv, source) {
  const out = [];
  for (const row of ohlcv) {
    const [t, o, h, l, c] = row;
    switch (source) {
      case 'open': out.push(o); break;
      case 'high': out.push(h); break;
      case 'low': out.push(l); break;
      case 'hl2': out.push((h + l) / 2); break;
      case 'hlc3': out.push((h + l + c) / 3); break;
      case 'ohlc4': out.push((o + h + l + c) / 4); break;
      case 'close':
      default: out.push(c); break;
    }
  }
  return out;
}

function parseParam(val, inputs) {
  if (val === undefined || val === null) return undefined;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    if (val.startsWith('$')) return inputs[val.slice(1)];
    const num = parseFloat(val);
    if (!isNaN(num)) return num;
    return val;
  }
  return val;
}

function computeIndicators(spec, ohlcv) {
  const inputs = spec.inputs || {};
  const series = {};
  const close = getSeriesFromSource(ohlcv, 'close');
  const high = getSeriesFromSource(ohlcv, 'high');
  const low = getSeriesFromSource(ohlcv, 'low');
  for (const ind of spec.indicators || []) {
    const src = getSeriesFromSource(ohlcv, ind.source || 'close');
    const p = ind.params || {};
    const length = parseParam(p.length, inputs);
    switch (ind.fn) {
      case 'EMA':
        series[ind.id] = indicators.EMA(src, length);
        break;
      case 'SMA':
        series[ind.id] = indicators.SMA(src, length);
        break;
      case 'RMA':
        series[ind.id] = indicators.RMA(src, length);
        break;
      case 'RSI':
        series[ind.id] = indicators.RSI(src, length);
        break;
      case 'BB': {
        const stdDev = parseParam(p.stdDev, inputs) || 2;
        const res = indicators.Bollinger(src, length, stdDev);
        series[`${ind.id}.upper`] = res.upper;
        series[`${ind.id}.middle`] = res.middle;
        series[`${ind.id}.lower`] = res.lower;
        break;
      }
      case 'ADX': {
        const res = indicators.ADX(high, low, close, length);
        series[`${ind.id}.adx`] = res.adx;
        series[`${ind.id}.plusDI`] = res.plusDI;
        series[`${ind.id}.minusDI`] = res.minusDI;
        break;
      }
      default:
        throw new Error(`Unknown indicator fn ${ind.fn}`);
    }
  }
  return series;
}

function getValue(ref, i, series, inputs) {
  if (typeof ref === 'number') return ref;
  if (typeof ref === 'string') {
    if (ref.startsWith('$')) return inputs[ref.slice(1)];
    if (series[ref]) return series[ref][i];
    const num = parseFloat(ref);
    if (!isNaN(num)) return num;
  }
  return undefined;
}

function evalExpr(expr, i, series, inputs) {
  const op = expr[0];
  switch (op) {
    case 'AND':
      return expr.slice(1).every(e => evalExpr(e, i, series, inputs));
    case 'OR':
      return expr.slice(1).some(e => evalExpr(e, i, series, inputs));
    case 'NOT':
      return !evalExpr(expr[1], i, series, inputs);
    case 'CROSSOVER': {
      const aPrev = getValue(expr[1], i - 1, series, inputs);
      const bPrev = getValue(expr[2], i - 1, series, inputs);
      const a = getValue(expr[1], i, series, inputs);
      const b = getValue(expr[2], i, series, inputs);
      return aPrev !== undefined && bPrev !== undefined && aPrev <= bPrev && a > b;
    }
    case 'CROSSUNDER': {
      const aPrev = getValue(expr[1], i - 1, series, inputs);
      const bPrev = getValue(expr[2], i - 1, series, inputs);
      const a = getValue(expr[1], i, series, inputs);
      const b = getValue(expr[2], i, series, inputs);
      return aPrev !== undefined && bPrev !== undefined && aPrev >= bPrev && a < b;
    }
    case '>':
      return getValue(expr[1], i, series, inputs) > getValue(expr[2], i, series, inputs);
    case '<':
      return getValue(expr[1], i, series, inputs) < getValue(expr[2], i, series, inputs);
    case '>=':
      return getValue(expr[1], i, series, inputs) >= getValue(expr[2], i, series, inputs);
    case '<=':
      return getValue(expr[1], i, series, inputs) <= getValue(expr[2], i, series, inputs);
    case '==':
      return getValue(expr[1], i, series, inputs) === getValue(expr[2], i, series, inputs);
    case '!=':
      return getValue(expr[1], i, series, inputs) !== getValue(expr[2], i, series, inputs);
    default:
      return false;
  }
}

function evaluateRules(rules, series, inputs, barCount) {
  const names = Object.keys(rules || {});
  const results = {};
  for (const n of names) results[n] = new Array(barCount).fill(false);
  for (let i = 0; i < barCount; i++) {
    for (const n of names) {
      results[n][i] = evalExpr(rules[n], i, series, inputs);
    }
  }
  return results;
}

function generateSignals(params, ruleResults, ohlcv, close) {
  const signals = [];
  const entries = params.entries || [];
  const exits = params.exits || [];
  const names = Object.keys(ruleResults);
  for (let i = 1; i < close.length; i++) {
    const t = ohlcv[i][0];
    const price = close[i];
    for (const e of entries) {
      const arr = ruleResults[e.when];
      if (arr && arr[i] && !arr[i - 1]) {
        signals.push({ t, type: 'ENTRY', side: e.side, price, rule: e.when });
      }
    }
    for (const e of exits) {
      const arr = ruleResults[e.when];
      if (arr && arr[i] && !arr[i - 1]) {
        signals.push({ t, type: 'EXIT', side: e.side || 'BOTH', price, rule: e.when });
      }
    }
  }
  return signals;
}

function preview(spec, ohlcv) {
  const inputs = spec.inputs || {};
  const series = computeIndicators(spec, ohlcv);
  const close = getSeriesFromSource(ohlcv, 'close');
  const rules = evaluateRules(spec.rules, series, inputs, close.length);
  const signals = generateSignals(spec, rules, ohlcv, close);
  return { ohlcv, overlays: series, signals };
}

function collectIndicatorRefs(spec) {
  const refs = new Set();
  for (const ind of spec.indicators || []) {
    switch (ind.fn) {
      case 'BB':
        refs.add(`${ind.id}.upper`);
        refs.add(`${ind.id}.middle`);
        refs.add(`${ind.id}.lower`);
        break;
      case 'ADX':
        refs.add(`${ind.id}.adx`);
        refs.add(`${ind.id}.plusDI`);
        refs.add(`${ind.id}.minusDI`);
        break;
      default:
        refs.add(ind.id);
    }
  }
  return refs;
}

function collectRuleRefs(expr, set) {
  if (!Array.isArray(expr)) return;
  const op = expr[0];
  if (['AND', 'OR'].includes(op)) {
    for (let i = 1; i < expr.length; i++) collectRuleRefs(expr[i], set);
  } else if (['NOT'].includes(op)) {
    collectRuleRefs(expr[1], set);
  } else {
    for (let i = 1; i < expr.length; i++) {
      const r = expr[i];
      if (typeof r === 'string' && !r.startsWith('$') && isNaN(parseFloat(r))) set.add(r);
    }
  }
}

function validate(spec) {
  const errors = [];
  const inputs = spec.inputs || {};
  const idSet = new Set();
  for (let i = 0; i < (spec.indicators || []).length; i++) {
    const ind = spec.indicators[i];
    if (idSet.has(ind.id)) {
      errors.push({ path: `indicators[${i}].id`, message: 'Duplicate id' });
    } else {
      idSet.add(ind.id);
    }
    for (const [k, v] of Object.entries(ind.params || {})) {
      if (typeof v === 'string' && v.startsWith('$')) {
        const key = v.slice(1);
        if (!(key in inputs)) errors.push({ path: `indicators[${i}].params.${k}`, message: 'Unknown input' });
      }
    }
  }
  const indRefs = collectIndicatorRefs(spec);
  for (const [name, expr] of Object.entries(spec.rules || {})) {
    const refs = new Set();
    collectRuleRefs(expr, refs);
    for (const r of refs) {
      if (!indRefs.has(r) && !(r in inputs)) {
        errors.push({ path: `rules.${name}`, message: `Unknown reference ${r}` });
      }
    }
  }
  for (let i = 0; i < (spec.entries || []).length; i++) {
    const e = spec.entries[i];
    if (!spec.rules || !(e.when in spec.rules)) {
      errors.push({ path: `entries[${i}].when`, message: 'Unknown rule' });
    }
  }
  for (let i = 0; i < (spec.exits || []).length; i++) {
    const e = spec.exits[i];
    if (!spec.rules || !(e.when in spec.rules)) {
      errors.push({ path: `exits[${i}].when`, message: 'Unknown rule' });
    }
  }
  return { valid: errors.length === 0, errors };
}

module.exports = { computeIndicators, preview, validate };