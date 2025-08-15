import React, { useEffect, useState, useCallback } from 'react';
import { Button } from 'primereact/button';
import FiltersBar from '../../components/trading/FiltersBar';
import KpiCard from '../../components/trading/KpiCard';
import EquityChart from '../../components/trading/EquityChart';
import PnlDailyChart from '../../components/trading/PnlDailyChart';
import SummaryTable from '../../components/trading/SummaryTable';
import './TradingStyles.css';

const TradingDashboardPage = () => {
  const today = new Date();
  const defaultFrom = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
  const [filters, setFilters] = useState({
    from: defaultFrom.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
    exchange: ''
  });
  const [summary, setSummary] = useState(null);
  const [equity, setEquity] = useState([]);
  const [pnlDaily, setPnlDaily] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams({
      from: new Date(filters.from).toISOString(),
      to: new Date(filters.to).toISOString(),
      exchange: filters.exchange || ''
    }).toString();
   
    try {
      const resSummary = await fetch(`/api/dashboard/summary?${params}`);
      if (!resSummary.ok) {
        throw new Error(resSummary.status === 401 ? 'Unauthorized' : 'Failed to load summary');
      }
      const dataSummary = await resSummary.json();
      setSummary(dataSummary);

      const resEquity = await fetch(`/api/dashboard/equity-curve?${params}`);
      if (resEquity.ok) {
        const dataEquity = await resEquity.json();
        setEquity(dataEquity.points || []);
      } else {
        setEquity([]);
      }

      const resPnl = await fetch(`/api/dashboard/pnl-daily?${params}`);
      if (resPnl.ok) {
        const dataPnl = await resPnl.json();
        setPnlDaily(dataPnl.days || []);
      } else {
        setPnlDaily([]);
      }

      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data', err);
      setError(err.message);
      setSummary(null);
      setEquity([]);
      setPnlDaily([]);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (summary?.robots?.some(r => r.status === 'RUNNING')) {
      const id = setInterval(fetchData, 15000);
      return () => clearInterval(id);
    }
  }, [summary, fetchData]);

   if (error) {
    return <div className="p-4 trading-page-container">{error}</div>;
  }

  if (!summary) {
    return <div className="p-4 trading-page-container">Loading...</div>;
  }

  return (
    <div className="p-4 trading-page-container">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Dashboard Trading</h1>
        <Button icon="pi pi-refresh" onClick={fetchData} size="small" rounded text aria-label="Actualiser" />
      </div>
      {lastUpdated && (
        <p className="text-sm text-gray-500 mb-4">Dernière mise à jour : {lastUpdated.toLocaleString()}</p>
      )}
      <FiltersBar filters={filters} onChange={setFilters} />
      <div className="grid">
        <div className="col-12 md:col-4">
          <KpiCard
            label="Equity"
            value={
              summary?.equity?.current != null
                ? `${summary.equity.current.toFixed(2)} ${summary.currency}`
                : '-'
            }
          />
        </div>
        <div className="col-12 md:col-4">
                    <KpiCard
            label="PnL Jour"
            value={summary?.pnl?.day != null ? summary.pnl.day.toFixed(2) : '-'}
          />
        </div>
        <div className="col-12 md:col-4">
           <KpiCard label="Trades" value={summary?.tradesCount ?? '-'} />
        </div>
      </div>
      <div className="grid mt-4">
        <div className="col-12 lg:col-6">
          <EquityChart points={equity} />
        </div>
        <div className="col-12 lg:col-6">
          <PnlDailyChart days={pnlDaily} />
        </div>
      </div>
      <div className="mt-4">
        <SummaryTable robots={summary?.robots || []} backtests={summary?.backtests || []} />
      </div>
    </div>
  );
};
export default TradingDashboardPage;