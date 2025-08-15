import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StrategyForm from '../../components/trading/StrategyForm';
import StrategyPreview from '../../components/trading/StrategyPreview';
import { fetchStrategyKinds, getStrategy, createStrategy, updateStrategy, validateStrategy } from '../../services/strategies';

const StrategyEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kinds, setKinds] = useState([]);
  const [strategy, setStrategy] = useState({ name: '', kind: '', params: {} });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchStrategyKinds().then((ks) => {
      setKinds(ks);
      if (!id && ks.length) setStrategy((s) => ({ ...s, kind: ks[0].kind }));
    });
  }, [id]);

  useEffect(() => {
    if (id) {
      getStrategy(id).then((s) => setStrategy({ name: s.name, kind: s.kind, params: s.params }));
    }
  }, [id]);

  const handleSave = async () => {
    try {
      await validateStrategy({ kind: strategy.kind, params: strategy.params });
      setErrors({});
    } catch (e) {
      setErrors(e.response?.data?.error?.details || {});
      return;
    }
    if (id) {
      await updateStrategy(id, { name: strategy.name, params: strategy.params });
    } else {
      const res = await createStrategy(strategy);
      navigate(`/trading/strategies/${res.id}`);
      return;
    }
    navigate('/trading/strategies');
  };

  return (
    <div className="p-4 trading-page-container">
      <h1 className="text-2xl mb-3">{id ? 'Éditer' : 'Nouvelle'} stratégie</h1>
      <StrategyForm strategy={strategy} kinds={kinds} errors={errors} onChange={setStrategy} onValidate={async (s) => {
        try {
          await validateStrategy({ kind: s.kind, params: s.params });
          setErrors({});
        } catch (e) {
          setErrors(e.response?.data?.error?.details || {});
        }
      }} />
      <div className="mt-4">
        <button className="p-button" onClick={handleSave}>Enregistrer</button>
        <button className="p-button p-button-text" onClick={() => navigate('/trading/strategies')}>Annuler</button>
      </div>
      <div className="mt-4">
        <StrategyPreview kind={strategy.kind} params={strategy.params} />
      </div>
    </div>
  );
};

export default StrategyEditPage;