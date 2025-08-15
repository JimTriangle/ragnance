const ccxt = require('ccxt');

async function fetchOHLC(pair, timeframe, from, to) {
  const kraken = new ccxt.kraken();
  const msPerBar = kraken.parseTimeframe(timeframe) * 1000;
  let since = from;
  let ohlc = [];
  while (true) {
    const candles = await kraken.fetchOHLCV(pair, timeframe, since, 500);
    if (!candles.length) break;
    ohlc.push(...candles);
    const last = candles[candles.length - 1][0];
    since = last + msPerBar;
    if (last >= to) break;
  }
  return ohlc.filter(c => c[0] >= from && c[0] <= to);
}

async function fetchBalance(apiKey, apiSecret) {
  const kraken = new ccxt.kraken({ apiKey, secret: apiSecret });
  return kraken.fetchBalance();
}

module.exports = { fetchOHLC, fetchBalance };