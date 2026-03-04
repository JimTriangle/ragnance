import React from 'react';
import '../../styles/cards.css';

const KpiCard = ({ label, value, variation, icon, iconBg, iconColor }) => (
  <div className="kpi-modern">
    {icon && (
      <div
        className="kpi-modern__icon"
        style={{ background: iconBg || 'rgba(46, 204, 113, 0.12)', color: iconColor || '#2ECC71' }}
      >
        <i className={`pi ${icon}`}></i>
      </div>
    )}
    <span className="kpi-modern__label">{label}</span>
    <span className="kpi-modern__value">{value}</span>
    {variation !== undefined && (
      <span className={`kpi-modern__sub ${variation >= 0 ? 'kpi-modern__sub--positive' : 'kpi-modern__sub--negative'}`}>
        {variation >= 0 ? '+' : ''}{variation}
      </span>
    )}
  </div>
);

export default KpiCard;
