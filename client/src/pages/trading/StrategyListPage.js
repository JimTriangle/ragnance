import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import StrategyList from '../../components/trading/StrategyList';
import ConfirmDialog from '../../components/trading/ConfirmDialog';
import { fetchStrategies, getStrategy, createStrategy, deleteStrategy } from '../../services/strategies';
import { ToastContext } from '../../context/ToastContext';

const StrategyListPage = () => {
  const [items, setItems] = useState([]);
  const [confirmId, setConfirmId] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useContext(ToastContext);

  const load = () => fetchStrategies().then(setItems);
  useEffect(() => { load(); }, []);

  const handleDuplicate = async (id) => {
    try {
      const s = await getStrategy(id);
      await createStrategy({ name: s.name + ' (copy)', kind: s.kind, params: s.params });
      showToast('success', 'Succès', 'Stratégie dupliquée');
      load();
    } catch {
      showToast('error', 'Erreur', 'Impossible de dupliquer la stratégie');
    }
  };

  const handleDelete = async () => {
    if (confirmId) {
      try {
        await deleteStrategy(confirmId);
        showToast('success', 'Succès', 'Stratégie supprimée');
      } catch {
        showToast('error', 'Erreur', 'Impossible de supprimer la stratégie');
      }
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