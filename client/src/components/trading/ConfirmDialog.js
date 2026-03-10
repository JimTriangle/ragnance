import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

const ConfirmDialog = ({ visible, message, onConfirm, onHide }) => {
  const footer = (
    <div>
      <Button label="Annuler" onClick={onHide} className="btn-modern btn-modern--ghost" />
      <Button label="Confirmer" onClick={onConfirm} className="btn-modern btn-modern--danger" autoFocus />
    </div>
  );
  return (
    <Dialog header="Confirmation" visible={visible} onHide={onHide} footer={footer} style={{ width: '350px' }}>
      <p>{message}</p>
    </Dialog>
  );
};

export default ConfirmDialog;