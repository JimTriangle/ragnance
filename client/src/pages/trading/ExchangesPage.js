import React, { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import ExchangeKeyList from '../../components/trading/ExchangeKeyList';
import ExchangeKeyForm from '../../components/trading/ExchangeKeyForm';
import ConfirmDialog from '../../components/trading/ConfirmDialog';
import { listExchangeKeys, getExchangeKey, createExchangeKey, updateExchangeKey, rotateExchangeSecret, deleteExchangeKey, testExchangeKey } from '../../services/exchangeKeys';

const ExchangesPage = () => {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null); // null -> list, object -> form
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async () => {
    try {
      const data = await listExchangeKeys();
      setItems(data);
    } catch (e) {
      setItems([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleNew = () => setEditing({});

  const handleEdit = async (id) => {
    const data = await getExchangeKey(id);
    setEditing(data);
  };

  const handleTest = async (id) => {
    try {
      await testExchangeKey({ id });
      load();
    } catch (e) {
      // ignore
    }
  };

  const handleDelete = (id) => setConfirmDelete(id);

  const confirmDeleteAction = async () => {
    await deleteExchangeKey(confirmDelete);
    setConfirmDelete(null);
    load();
  };

  const handleSave = async (form) => {
    if (editing && editing.id) {
      await updateExchangeKey(editing.id, { label: form.label, sandbox: form.sandbox });
      if (form.apiSecret) {
        await rotateExchangeSecret(editing.id, { apiKey: form.apiKey, apiSecret: form.apiSecret });
      }
    } else {
      await createExchangeKey(form);
    }
    setEditing(null);
    load();
  };

  const handleCancel = () => setEditing(null);

  return (
    <div className="p-4 trading-page-container">
      <h1 className="text-2xl font-bold mb-4">Connexions Exchanges</h1>
      <Card>
        {editing ? (
          <ExchangeKeyForm initialData={editing} onSave={handleSave} onCancel={handleCancel} />
        ) : (
          <ExchangeKeyList items={items} onNew={handleNew} onEdit={handleEdit} onTest={handleTest} onDelete={handleDelete} />
        )}
      </Card>
      <ConfirmDialog visible={!!confirmDelete} onHide={() => setConfirmDelete(null)} onConfirm={confirmDeleteAction} message="Supprimer cette clé ?" />
    </div>
  );
};

export default ExchangesPage;