import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './TradingStyles.css';

const BacktestDetailPage = () => {
  const { id } = useParams();
  const [summary, setSummary] = useState(null);
  const [equity, setEquity] = useState([]);
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const s = await axios.get(`/api/backtests/${id}`);
        setSummary(s.data);
        const eq = await axios.get(`/api/backtests/${id}/equity`);
        setEquity(eq.data.points || []);
        const tr = await axios.get(`/api/backtests/${id}/trades`);
        setTrades(tr.data.items || []);
      } catch (e) {
        console.error('Failed to load backtest', e);
      }
    }
    load();
  }, [id]);

  if (!summary) return <div className="p-4 trading-page-container">Chargement...</div>;

  return (
    <div className="p-4 trading-page-container">
      <h1 className="text-2xl font-bold mb-4">Backtest {id}</h1>
      <div className="mb-4">
        <h2 className="text-xl font-bold">KPIs</h2>
        <ul>
          <li>PnL %: {summary.kpis.pnlPct}</li>
          <li>PnL Value: {summary.kpis.pnlValue}</li>
          <li>Trades: {summary.kpis.trades}</li>
          <li>Winrate: {summary.kpis.winrate}</li>
          <li>Max DD%: {summary.kpis.maxDrawdownPct}</li>
        </ul>
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-bold">Equity Points ({equity.length})</h2>
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-bold">Trades ({trades.length})</h2>
        <table className="summary-table w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>Side</th>
              <th>PnL</th>
            </tr>
          </thead>
          <tbody>
            {trades.map(t => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.side}</td>
                <td>{t.pnl}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mb-4 space-x-3">
        <a href={`/api/backtests/${id}/export/trades.csv`} className="p-button" download>Export CSV</a>
        <a href={`/api/backtests/${id}/export/equity.png`} className="p-button" download>Export Equity PNG</a>
      </div>
    </div>
  );
};

export default BacktestDetailPage;