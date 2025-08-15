import React from 'react';
import { Tag } from 'primereact/tag';

const map = { VALID: 'success', ERROR: 'danger', UNTESTED: 'secondary' };

export default function StatusBadge({ status }) {
  return <Tag value={status} severity={map[status] || 'secondary'} />;
}