import React from 'react';

const FiltersBar = ({ filters, onChange }) => {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="filters-bar flex align-items-end gap-2 mb-4">
      <span>
        <label className="block text-xs">From</label>
        <input type="date" value={filters.from} onChange={e => update('from', e.target.value)} />
      </span>
      <span>
        <label className="block text-xs">To</label>
        <input type="date" value={filters.to} onChange={e => update('to', e.target.value)} />
      </span>
      <span>
        <label className="block text-xs">Exchange</label>
        <select value={filters.exchange} onChange={e => update('exchange', e.target.value)}>
          <option value="">All</option>
          <option value="BINANCE">BINANCE</option>
          <option value="KRAKEN">KRAKEN</option>
        </select>
      </span>
    </div>
  );
};

export default FiltersBar;