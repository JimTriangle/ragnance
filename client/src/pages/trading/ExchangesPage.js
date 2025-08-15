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
    try {
      if (editing && editing.id) {
        await updateExchangeKey(editing.id, { label: form.label, sandbox: form.sandbox });
        if (form.apiSecret) {
          await rotateExchangeSecret(editing.id, { apiKey: form.apiKey, apiSecret: form.apiSecret });
        }
      } else {
        await createExchangeKey(form);
      }
      console.log('Clé API enregistrée');
    } catch (e) {
      const msg = e.response?.data?.message || e.response?.data?.error?.message || e.message;
      console.error('Erreur lors de l\'enregistrement de la clé API:', msg);
    }
    setEditing(null);
    load();
  };

  const handleCancel = () => setEditing(null);

  return (
    <div className="p-4 trading-page-container">
      <h1 className="text-2xl font-bold mb-4">Clés API (Exchanges)</h1>
      {editing ? (
        <div className="md:flex md:gap-6">
          <div className="md:w-1/2 mb-4 md:mb-0 p-3 border-round surface-50">
            <h2 className="text-xl mb-2">Comment connecter un exchange ?</h2>
            <ol className="ml-4 list-decimal">
              <li>Créez une clé API depuis le site de votre exchange.</li>
              <li>Activez le mode sandbox/testnet si disponible.</li>
              <li>Copiez la clé et le secret générés.</li>
              <li>Cliquez sur "Nouvelle clé" puis collez vos identifiants.</li>
              <li>Testez la connexion avant d'enregistrer.</li>
            </ol>
            <p className="mt-2">
              <a
                href="https://www.binance.com/en/my/settings/api-management"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Guide Binance
              </a>
            </p>
            <p>
              <a
                href="https://support.kraken.com/hc/en-us/articles/360000919866-How-to-create-an-API-key"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Guide Kraken
              </a>
            </p>
          </div>
          <div className="md:w-1/2">
            <Card>
              <ExchangeKeyForm
                initialData={editing}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <ExchangeKeyList
            items={items}
            onNew={handleNew}
            onEdit={handleEdit}
            onTest={handleTest}
            onDelete={handleDelete}
          />
        </Card>
      )}
      <ConfirmDialog visible={!!confirmDelete} onHide={() => setConfirmDelete(null)} onConfirm={confirmDeleteAction} message="Supprimer cette clé ?" />
    </div>
  );
};

export default ExchangesPage;