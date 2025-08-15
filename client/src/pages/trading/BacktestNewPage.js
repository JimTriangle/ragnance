import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './TradingStyles.css';

const BacktestNewPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    strategyId: 'EMA_CROSS',
    exchange: 'BINANCE',
    pair: 'BTC/USDT',
    timeframe: '1h',
    from: '',
    to: '',
    initialCapital: 1000
  });

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const body = {
        ...form,
        from: new Date(form.from).toISOString(),
        to: new Date(form.to).toISOString(),
        feeBps: 10,
        slippageBps: 5,
        positionSizing: { mode: 'FixedFraction', riskPctPerTrade: 1 },
        rules: { allowShort: false, orderType: 'market', limitOffsetBps: 0, maxConcurrentPositions: 1 },
        split: { enabled: false, ratio: 0.8 }
      };
      const res = await api.post('/backtests', body);
      navigate(`/trading/backtests/${res.data.id}`);
    } catch (err) {
      console.error('Failed to create backtest', err);
    }
  };

  return (
    <div className="p-4 trading-page-container">
      <h1 className="text-2xl font-bold mb-4">Nouveau backtest</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label>Strategy</label>
          <select name="strategyId" value={form.strategyId} onChange={handleChange}>
            <option value="EMA_CROSS">EMA_CROSS</option>
            <option value="RSI">RSI</option>
            <option value="BB">BB</option>
            <option value="ADX_TREND">ADX_TREND</option>
          </select>
        </div>
        <div>
          <label>Exchange</label>
          <select name="exchange" value={form.exchange} onChange={handleChange}>
            <option value="BINANCE">BINANCE</option>
            <option value="KRAKEN">KRAKEN</option>
          </select>
        </div>
        <div>
          <label>Pair</label>
          <input name="pair" value={form.pair} onChange={handleChange} />
        </div>
        <div>
          <label>Timeframe</label>
          <select name="timeframe" value={form.timeframe} onChange={handleChange}>
            <option value="1m">1m</option>
            <option value="5m">5m</option>
            <option value="15m">15m</option>
            <option value="1h">1h</option>
            <option value="4h">4h</option>
            <option value="1d">1d</option>
          </select>
        </div>
        <div>
          <label>From</label>
          <input type="datetime-local" name="from" value={form.from} onChange={handleChange} />
        </div>
        <div>
          <label>To</label>
          <input type="datetime-local" name="to" value={form.to} onChange={handleChange} />
        </div>
        <div>
          <label>Initial capital</label>
          <input type="number" name="initialCapital" value={form.initialCapital} onChange={handleChange} />
        </div>
        <button type="submit" className="p-button">Lancer</button>
      </form>
    </div>
  );
};

export default BacktestNewPage;