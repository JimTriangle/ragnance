const express = require('express');
const router = express.Router();

const MOCK_MARKETS = [
  {symbol: 'BTC/USDT'},
  {symbol: 'ETH/USDT'},
  {symbol: 'ADA/USDT'},
  {symbol: 'BTC/EUR'},
  {symbol: 'ETH/EUR'}
];

router.get('/', (req, res) => {
  const { exchange, query = '' } = req.query;
  // In mock mode we ignore exchange and return deterministic list
  const q = query.toLowerCase();
  const items = MOCK_MARKETS.filter(m => m.symbol.toLowerCase().includes(q));
  res.json({ items });
});

module.exports = router;