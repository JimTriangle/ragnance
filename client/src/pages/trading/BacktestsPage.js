import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import axios from 'axios';
import './TradingStyles.css';

const BacktestsPage = () => {
  const [backtests, setBacktests] = useState([]);
  const navigate = useNavigate();
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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Backtests</h1>
        <Button label="Nouveau backtest" onClick={() => navigate('/trading/backtests/new')} />
      </div>
      <DataTable value={backtests} dataKey="id" responsiveLayout="scroll" paginator rows={10} rowsPerPageOptions={[5, 10, 20]}>
        <Column field="id" header="ID" body={(row) => <Link to={`/trading/backtests/${row.id}`}>{row.id}</Link>} sortable />
        <Column field="pair" header="Pair" sortable />
        <Column field="timeframe" header="Timeframe" sortable />
        <Column field="pnlPct" header="PnL %" sortable />
        <Column field="createdAt" header="Created" sortable />
      </DataTable>
    </div>
  );
};

export default BacktestsPage;