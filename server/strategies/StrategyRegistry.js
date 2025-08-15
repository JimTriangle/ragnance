const rulesEngine = require('./rulesEngine');

const KINDS = ['EMA_CROSS', 'RSI', 'BB', 'ADX_TREND', 'RULES_ENGINE'];

function listKinds() {
  return KINDS.slice();
}

function getSchema(kind) {
  if (kind === 'RULES_ENGINE') {
    return {
      type: 'object',
      properties: {
        inputs: { type: 'object', additionalProperties: { type: ['number', 'string', 'boolean'] } },
        indicators: { type: 'array' },
        rules: { type: 'object' },
        entries: { type: 'array' },
        exits: { type: 'array' },
        risk: { type: 'object' }
      }
    };
  }
  return {};
}

function validate(kind, params) {
  if (kind === 'RULES_ENGINE') {
    return rulesEngine.validate(params);
  }
  return { valid: true, errors: [] };
}

function preview(kind, params, ohlcv) {
  if (kind === 'RULES_ENGINE') {
    return rulesEngine.preview(params, ohlcv);
  }
  return { ohlcv: ohlcv || [], overlays: {}, signals: [] };
}

module.exports = { listKinds, getSchema, validate, preview };