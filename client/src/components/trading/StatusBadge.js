import React from 'react';
import { Tag } from 'primereact/tag';

// Maps backend status codes to PrimeReact tag severities and French labels
const STATUS_MAP = {
  VALID: { severity: 'success', label: 'Valide' },
  INVALID: { severity: 'danger', label: 'Invalide' },
  ERROR: { severity: 'danger', label: 'Erreur' },
  UNKNOWN: { severity: 'info', label: 'Inconnu' },
  UNTESTED: { severity: 'warning', label: 'Non testé' },
};

const StatusBadge = ({ status }) => {
  const { severity, label } = STATUS_MAP[status] || {
    severity: 'info',
    label: status,
  };

  return <Tag value={label} severity={severity} />;
};

export default StatusBadge;