import React from 'react';
import { Button } from 'primereact/button';

const StrategyList = ({ items, onEdit, onDuplicate, onDelete }) => (
  <div>
    <table className="w-full">
      <thead>
        <tr>
          <th>Nom</th>
          <th>Type</th>
          <th>Dernière MAJ</th>
          <th>Backtests</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {items.map((s) => (
          <tr key={s.id}>
            <td>{s.name}</td>
            <td>{s.kind}</td>
            <td>{new Date(s.updatedAt).toLocaleString()}</td>
            <td>{s.backtestsCount}</td>
            <td>
              <Button className="p-button-text" label="Éditer" onClick={() => onEdit(s.id)} />
              <Button className="p-button-text" label="Dupliquer" onClick={() => onDuplicate(s.id)} />
              <Button className="p-button-text p-button-danger" label="Supprimer" onClick={() => onDelete(s.id)} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default StrategyList;