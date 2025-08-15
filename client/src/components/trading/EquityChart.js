import React from 'react';
import { Chart } from 'primereact/chart';

const EquityChart = ({ points }) => {
  const chartData = {
    labels: points.map(p => new Date(p.t).toLocaleDateString()),
    datasets: [
      {
        label: 'Equity',
        data: points.map(p => p.equity),
        fill: false,
        borderColor: '#2ECC71',
        tension: 0.4
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
      <Chart type="line" data={chartData} options={options} />
    </div>
  );
};

export default EquityChart;