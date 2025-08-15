import React from 'react';
import { Chart } from 'primereact/chart';

const PnlDailyChart = ({ days }) => {
  const chartData = {
    labels: days.map(d => d.date),
    datasets: [
      {
        label: 'PnL',
        data: days.map(d => d.pnl),
        backgroundColor: days.map(d => d.pnl >= 0 ? '#2ECC71' : '#E74C3C')
      }
    ]
  };

  const options = {
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#CCC' }, grid: { color: 'rgba(255,255,255,0.1)' } },
      y: { ticks: { color: '#CCC' }, grid: { color: 'rgba(255,255,255,0.1)' } }
    }
  };

  return (
    <div style={{ position: 'relative', height: '300px' }}>
      <Chart type="bar" data={chartData} options={options} />
    </div>
  );
};

export default PnlDailyChart;