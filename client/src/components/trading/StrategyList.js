import React from 'react';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

const StrategyList = ({ items, onEdit, onDuplicate, onDelete }) => (
  <div>
     <DataTable
    value={items}
    dataKey="id"
    responsiveLayout="stack"
    className="trading-datatable"
    stripedRows
  >
    <Column field="name" header="Nom" />
    <Column field="kind" header="Type" />
    <Column
      field="updatedAt"
      header="Dernière MAJ"
      body={(row) => new Date(row.updatedAt).toLocaleString()}
    />
    <Column field="backtestsCount" header="Backtests" />
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
            icon="pi pi-copy"
            rounded
            text
            onClick={() => onDuplicate(row.id)}
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

export default StrategyList;