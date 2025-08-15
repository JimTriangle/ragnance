import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

const ConfirmDialog = ({ visible, message, onConfirm, onHide }) => {
  const footer = (
    <div>
      <Button label="Annuler" onClick={onHide} className="p-button-text" />
      <Button label="Confirmer" onClick={onConfirm} autoFocus />
    </div>
  );
  return (
    <Dialog header="Confirmation" visible={visible} onHide={onHide} footer={footer} style={{ width: '350px' }}>
      <p>{message}</p>
    </Dialog>
  );
};

export default ConfirmDialog;