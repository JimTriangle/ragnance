import React from 'react';
import { Button } from 'primereact/button';
import StatusBadge from './StatusBadge';

const ExchangeKeyList = ({ items, onNew, onEdit, onTest, onDelete }) => (
  <div>
    <div className="flex justify-content-between mb-3">
      <h2>Clés API</h2>
      <Button label="Nouveau" onClick={onNew} />
    </div>
    <table className="w-full">
      <thead>
        <tr>
          <th>Label</th>
          <th>Exchange</th>
          <th>Statut</th>
          <th>Créée le</th>
          <th>Dernier test</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map((k) => (
          <tr key={k.id}>
            <td>{k.label}</td>
            <td>{k.exchange}</td>
            <td><StatusBadge status={k.meta?.lastTestStatus || 'UNTESTED'} /></td>
            <td>{new Date(k.createdAt).toLocaleString()}</td>
            <td>{k.meta?.lastTestAt ? new Date(k.meta.lastTestAt).toLocaleString() : '-'}</td>
            <td>
              <Button label="Éditer" className="p-button-text" onClick={() => onEdit(k.id)} />
              <Button label="Tester" className="p-button-text" onClick={() => onTest(k.id)} />
              <Button label="Supprimer" className="p-button-text p-button-danger" onClick={() => onDelete(k.id)} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default ExchangeKeyList;