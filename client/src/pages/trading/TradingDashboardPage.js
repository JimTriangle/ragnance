import React, { useEffect, useState } from 'react';
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

    const fetchData = () => {
        const params = new URLSearchParams({
            from: new Date(filters.from).toISOString(),
            to: new Date(filters.to).toISOString(),
            exchange: filters.exchange || ''
        }).toString();

        fetch(`/api/dashboard/summary?${params}`)
            .then(res => res.json())
            .then(setSummary);
        fetch(`/api/dashboard/equity-curve?${params}`)
            .then(res => res.json())
            .then(data => setEquity(data.points));
        fetch(`/api/dashboard/pnl-daily?${params}`)
            .then(res => res.json())
            .then(data => setPnlDaily(data.days));
    };

    useEffect(() => {
        fetchData();
    }, [filters]);

    useEffect(() => {
        if (summary && summary.robots.some(r => r.status === 'RUNNING')) {
            const id = setInterval(fetchData, 15000);
            return () => clearInterval(id);
        }
    }, [summary, filters]);

    if (!summary) {
        return <div className="p-4 trading-page-container">Loading...</div>;
    }

    return (
        <div className="p-4 trading-page-container">
            <h1 className="text-2xl font-bold mb-4">Dashboard Trading</h1>
            <FiltersBar filters={filters} onChange={setFilters} />
            <div className="grid">
                <div className="col-12 md:col-4">
                    <KpiCard label="Equity" value={`${summary.equity.current.toFixed(2)} ${summary.currency}`} />
                </div>
                <div className="col-12 md:col-4">
                    <KpiCard label="PnL Jour" value={summary.pnl.day.toFixed(2)} />
                </div>
                <div className="col-12 md:col-4">
                    <KpiCard label="Trades" value={summary.tradesCount} />
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
                <SummaryTable robots={summary.robots} backtests={summary.backtests} />
            </div>
        </div>
    );
};

export default TradingDashboardPage;