import React from 'react';
import { Button } from 'primereact/button';
import StatusBadge from './StatusBadge';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

const ExchangeKeyList = ({ items, onNew, onEdit, onTest, onDelete }) => (
  <div>
    <div className="flex justify-content-between mb-3">
      <h2>Clés API</h2>
      <Button label="Nouveau" onClick={onNew} />
    </div>
    <DataTable
      value={items}
      dataKey="id"
      responsiveLayout="stack"
      className="trading-datatable"
      stripedRows
    >
      <Column field="label" header="Label" />
      <Column field="exchange" header="Exchange" />
      <Column
        header="Statut"
        body={(row) => <StatusBadge status={row.meta?.lastTestStatus || 'UNTESTED'} />}
      />
      <Column
        field="createdAt"
        header="Créée le"
        body={(row) => new Date(row.createdAt).toLocaleString()}
      />
      <Column
        header="Dernier test"
        body={(row) =>
          row.meta?.lastTestAt ? new Date(row.meta.lastTestAt).toLocaleString() : '-'
        }
      />
      <Column
        header="Actions"
        body={(row) => (
          <div className="flex gap-2">
            <Button
              icon="pi pi-pencil"
              rounded
              text
              onClick={() => onEdit(row.id)}
            />
            <Button
              icon="pi pi-refresh"
              rounded
              text
              onClick={() => onTest(row.id)}
            />
            <Button
              icon="pi pi-trash"
              rounded
              text
              severity="danger"
              onClick={() => onDelete(row.id)}
            />
          </div>
        )}
      />
    </DataTable>
  </div>
);

export default ExchangeKeyList;