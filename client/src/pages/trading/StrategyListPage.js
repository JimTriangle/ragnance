import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import StrategyList from '../../components/trading/StrategyList';
import ConfirmDialog from '../../components/trading/ConfirmDialog';
import { fetchStrategies, getStrategy, createStrategy, deleteStrategy } from '../../services/strategies';

const StrategyListPage = () => {
  const [items, setItems] = useState([]);
  const [confirmId, setConfirmId] = useState(null);
  const navigate = useNavigate();

  const load = () => fetchStrategies().then(setItems);
  useEffect(() => { load(); }, []);

  const handleDuplicate = async (id) => {
    const s = await getStrategy(id);
    await createStrategy({ name: s.name + ' (copy)', kind: s.kind, params: s.params });
    load();
  };

  const handleDelete = async () => {
    if (confirmId) {
      await deleteStrategy(confirmId);
      setConfirmId(null);
      load();
    }
  };

  return (
    <div className="p-4 trading-page-container">
      <div className="flex justify-content-between mb-3">
        <h1 className="text-2xl font-bold">Stratégies</h1>
        <Button label="Nouvelle stratégie" onClick={() => navigate('/trading/strategies/new')} />
      </div>
      <Card>
        <StrategyList
          items={items}
          onEdit={(id) => navigate(`/trading/strategies/${id}`)}
          onDuplicate={handleDuplicate}
          onDelete={(id) => setConfirmId(id)}
        />
      </Card>
      <ConfirmDialog visible={!!confirmId} onHide={() => setConfirmId(null)} onConfirm={handleDelete} message="Supprimer cette stratégie ?" />
    </div>
  );
};

export default StrategyListPage;