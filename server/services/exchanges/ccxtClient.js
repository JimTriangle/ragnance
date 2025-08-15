const ccxt = require('ccxt');

module.exports = ({ exchange, apiKey, secret, sandbox }) => {
  const exClass = ccxt[exchange.toLowerCase()];
  if (!exClass) {
    const err = new Error('Exchange not supported');
    err.code = 'EXCHANGE_NOT_SUPPORTED';
    throw err;
  }
  const ex = new exClass({ apiKey, secret, enableRateLimit: true, timeout: 7000 });
  if (sandbox) {
    if (ex.urls && ex.urls.test) {
      ex.urls.api = ex.urls.test;
    } else if (ex.setSandboxMode) {
      ex.setSandboxMode(true);
    }
  }
  return ex;
};
