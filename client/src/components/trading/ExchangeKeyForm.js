import React, { useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { InputSwitch } from 'primereact/inputswitch';
import { Button } from 'primereact/button';
import { testExchangeKey } from '../../services/exchangeKeys';

const EXCHANGES = [
  { label: 'Binance', value: 'BINANCE' },
  { label: 'Kraken', value: 'KRAKEN' },
];

const ExchangeKeyForm = ({ initialData = {}, onSave, onCancel }) => {
  const [form, setForm] = useState({
    exchange: initialData.exchange || 'BINANCE',
    label: initialData.label || '',
    apiKey: initialData.apiKey || '',
    apiSecret: '',
    sandbox: initialData.sandbox || false,
  });
  const [testOk, setTestOk] = useState(false);
  const [loadingTest, setLoadingTest] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [error, setError] = useState('');
  const [replaceSecret, setReplaceSecret] = useState(!initialData.id);

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    setTestOk(false);
  };

  const handleTest = async () => {
    setLoadingTest(true);
    setCooldown(true);
    setError('');
    try {
      await testExchangeKey({ ...form, id: initialData.id });
      setTestOk(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Test failed');
      setTestOk(false);
    }
    setLoadingTest(false);
    setTimeout(() => setCooldown(false), 3000);
  };

  const canSave = () => {
    if (!initialData.id) {
      return testOk;
    }
    if (replaceSecret) {
      return testOk;
    }
    return true;
  };

  return (
    <div className="p-fluid">
      <div className="field">
        <label htmlFor="exchange">Exchange</label>
        <Dropdown id="exchange" value={form.exchange} options={EXCHANGES} onChange={(e) => handleChange('exchange', e.value)} disabled={!!initialData.id} />
      </div>
      <div className="field">
        <label htmlFor="label">Label</label>
        <InputText id="label" value={form.label} onChange={(e) => handleChange('label', e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="apiKey">API Key</label>
        <InputText id="apiKey" value={form.apiKey} onChange={(e) => handleChange('apiKey', e.target.value)} />
      </div>
      {replaceSecret ? (
        <div className="field">
          <label htmlFor="apiSecret">API Secret</label>
          <Password id="apiSecret" value={form.apiSecret} onChange={(e) => handleChange('apiSecret', e.target.value)} toggleMask feedback={false} />
        </div>
      ) : (
        <div className="field">
          <label>API Secret</label>
          <div className="flex align-items-center">
            <span>{initialData.secretMask}</span>
            <Button label="Remplacer le secret" className="p-button-text ml-2" onClick={() => setReplaceSecret(true)} />
          </div>
        </div>
      )}
      <div className="field">
        <label htmlFor="sandbox">Sandbox/Testnet</label>
        <InputSwitch id="sandbox" checked={form.sandbox} onChange={(e) => handleChange('sandbox', e.value)} />
      </div>
      {error && <small className="p-error" aria-live="polite">{error}</small>}
      <div className="flex mt-4">
        <Button label="Tester la connexion" onClick={handleTest} disabled={loadingTest || cooldown} className="mr-2" />
        <Button label="Enregistrer" onClick={() => onSave(form)} disabled={!canSave()} />
        <Button label="Annuler" className="p-button-text ml-2" onClick={onCancel} />
      </div>
    </div>
  );
};

export default ExchangeKeyForm;