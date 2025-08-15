import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './TradingStyles.css';

const BacktestsPage = () => {
  const [backtests, setBacktests] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await axios.get('/api/backtests');
        setBacktests(res.data.items || []);
      } catch (e) {
        console.error('Failed to load backtests', e);
      }
    }
    load();
  }, []);

  return (
    <div className="p-4 trading-page-container">
      <h1 className="text-2xl font-bold mb-4">Backtests</h1>
      <div className="mb-3">
        <Link to="/trading/backtests/new" className="p-button p-button-sm">Nouveau backtest</Link>
      </div>
      <table className="summary-table w-full">
        <thead>
          <tr>
            <th>ID</th>
            <th>Pair</th>
            <th>Timeframe</th>
            <th>PnL %</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {backtests.map(b => (
            <tr key={b.id}>
              <td><Link to={`/trading/backtests/${b.id}`}>{b.id}</Link></td>
              <td>{b.pair}</td>
              <td>{b.timeframe}</td>
              <td>{b.pnlPct}</td>
              <td>{b.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BacktestsPage;