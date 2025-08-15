import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import axios from 'axios';
import './TradingStyles.css';

const PortfolioListPage = () => {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/portfolios').then(res => setItems(res.data.items));
  }, []);

  const budgetBody = row => row.budget.toFixed(2);

  const deletePortfolio = id => {
    axios.delete(`/api/portfolios/${id}`).then(() => {
      setItems(items.filter(i => i.id !== id));
    });
  };

  return (
    <div className="p-4 trading-page-container">
      <h1 className="text-2xl font-bold mb-4">Portefeuilles</h1>
      <Button label="Nouveau portefeuille" className="mb-4" onClick={() => navigate('new')} />
      <DataTable value={items} dataKey="id" responsiveLayout="scroll" paginator rows={10} rowsPerPageOptions={[5, 10, 20]}>
        <Column field="name" header="Nom" sortable />
        <Column field="exchange" header="Exchange" sortable />
        <Column field="baseCurrency" header="Base" sortable />
        <Column field="budget" header="Budget" body={budgetBody} sortable />
        <Column field="allocPercent" header="% alloué" sortable />
        <Column field="pairsCount" header="Paires" sortable />
        <Column header="Actions" body={(row) => (
          <div className="flex gap-2">
            <Button label="Éditer" onClick={() => navigate(row.id)} size="small" />
            <Button label="Supprimer" onClick={() => deletePortfolio(row.id)} severity="danger" size="small" />
          </div>
        )} />
      </DataTable>
    </div>
  );
};

export default PortfolioListPage;