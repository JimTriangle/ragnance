import React from 'react';
import { Card } from 'primereact/card';

const KpiCard = ({ label, value, variation }) => (
  <Card className="kpi-card">
    <div className="text-sm mb-1">{label}</div>
    <div className="text-xl font-bold">{value}</div>
    {variation !== undefined && (
      <div className="text-xs text-color-secondary">
        {variation >= 0 ? '+' : ''}{variation}
      </div>
    )}
  </Card>
);

export default KpiCard;