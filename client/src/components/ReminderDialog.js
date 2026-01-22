import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import api from '../services/api';

const ReminderDialog = ({ visible, onHide }) => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchReminders();
    }
  }, [visible]);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/transactions/reminders');
      setReminders(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des rappels:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const dateBodyTemplate = (rowData) => {
    return formatDate(rowData.upcomingDate);
  };

  const daysBodyTemplate = (rowData) => {
    if (rowData.daysUntil === 0) {
      return <span className="font-bold text-red-500">Aujourd'hui</span>;
    } else if (rowData.daysUntil === 1) {
      return <span className="font-bold text-orange-500">Demain</span>;
    } else {
      return <span>Dans {rowData.daysUntil} jour{rowData.daysUntil > 1 ? 's' : ''}</span>;
    }
  };

  const amountBodyTemplate = (rowData) => {
    return `${rowData.amount.toFixed(2)} €`;
  };

  const categoryBodyTemplate = (rowData) => {
    if (!rowData.Categories || rowData.Categories.length === 0) {
      return <span className="text-gray-400">Aucune catégorie</span>;
    }
    return rowData.Categories.map(c => c.name).join(', ');
  };

  const footer = (
    <div>
      <Button label="Fermer" icon="pi pi-times" onClick={onHide} className="p-button-text" />
    </div>
  );

  return (
    <Dialog
      header="Rappels de dépenses à venir"
      visible={visible}
      style={{ width: '80vw', maxWidth: '900px' }}
      onHide={onHide}
      footer={footer}
      modal
    >
      {loading ? (
        <div className="text-center p-4">
          <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
        </div>
      ) : reminders.length === 0 ? (
        <div className="text-center p-4">
          <i className="pi pi-check-circle text-green-500" style={{ fontSize: '3rem' }}></i>
          <p className="mt-3 text-lg">Aucun rappel pour le moment</p>
        </div>
      ) : (
        <div>
          <p className="mb-3">
            Vous avez <strong>{reminders.length}</strong> dépense{reminders.length > 1 ? 's' : ''} à venir :
          </p>
          <DataTable value={reminders} responsiveLayout="scroll" stripedRows>
            <Column field="label" header="Libellé" style={{ minWidth: '150px' }} />
            <Column body={amountBodyTemplate} header="Montant" style={{ minWidth: '100px' }} />
            <Column body={categoryBodyTemplate} header="Catégories" style={{ minWidth: '150px' }} />
            <Column body={dateBodyTemplate} header="Date prévue" style={{ minWidth: '150px' }} />
            <Column body={daysBodyTemplate} header="Échéance" style={{ minWidth: '120px' }} />
          </DataTable>
        </div>
      )}
    </Dialog>
  );
};

export default ReminderDialog;
