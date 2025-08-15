import React from 'react';

const StrategyForm = ({ strategy, kinds, errors = {}, onChange, onValidate }) => {
  const schema = kinds.find(k => k.kind === strategy.kind);

  const update = (patch) => onChange({ ...strategy, ...patch });
  const updateParam = (key, value) => update({ params: { ...strategy.params, [key]: value } });

  const renderField = (f) => {
    const val = strategy.params[f.key] ?? '';
    const common = {
      id: f.key,
      value: val,
      onChange: (e) => updateParam(f.key, f.type === 'boolean' ? e.target.checked : (f.type === 'number' || f.type === 'integer' || f.type === 'percent' ? Number(e.target.value) : e.target.value))
    };
    let input;
    if (f.type === 'enum') {
      input = (
        <select {...common}>
          {f.values.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      );
    } else if (f.type === 'boolean') {
      input = (<input type="checkbox" checked={val || false} onChange={common.onChange} />);
    } else {
      input = (<input type="number" step={f.step} min={f.min} max={f.max} {...common} />);
    }
    return (
      <div key={f.key} className="mb-2">
        <label htmlFor={f.key}>{f.label}</label><br />
        {input}
        {f.min !== undefined && f.max !== undefined && <small> ({f.min} - {f.max})</small>}
        {errors[f.key] && <div style={{ color: 'red' }}>{errors[f.key]}</div>}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-2">
        <label htmlFor="name">Nom</label><br />
        <input id="name" value={strategy.name || ''} onChange={e => update({ name: e.target.value })} />
      </div>
      <div className="mb-2">
        <label htmlFor="kind">Type</label><br />
        <select id="kind" value={strategy.kind} onChange={e => update({ kind: e.target.value, params: {} })}>
          {kinds.map(k => <option key={k.kind} value={k.kind}>{k.label}</option>)}
        </select>
      </div>
      {schema && schema.fields.map(renderField)}
      {onValidate && <button type="button" onClick={() => onValidate(strategy)}>Valider les paramètres</button>}
    </div>
  );
};

export default StrategyForm;