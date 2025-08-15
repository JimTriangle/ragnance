import React, { useEffect, useState } from 'react';
import { Chart } from 'primereact/chart';
import { previewStrategy } from '../../services/strategies';

const StrategyPreview = ({ kind, params }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!kind) return;
    previewStrategy({ kind, params, limit: 200 }).then(setData).catch(() => {});
  }, [kind, params]);

  if (!data) return null;
  const labels = data.ohlcv.map(c => new Date(c[0]).toLocaleString());
  const datasets = [
    {
      label: 'Close',
      data: data.ohlcv.map(c => c[4]),
      borderColor: '#888',
      fill: false,
    }
  ];
  if (data.overlays) {
    Object.entries(data.overlays).forEach(([k, arr]) => {
      datasets.push({ label: k, data: arr, fill: false, borderDash: [4,4] });
    });
  }
  if (data.signals && data.signals.length) {
    datasets.push({
      type: 'scatter',
      label: 'signals',
      data: data.signals.map(s => ({ x: new Date(s.t).toLocaleString(), y: s.price })),
      borderColor: 'yellow',
      backgroundColor: 'yellow'
    });
  }
  const chartData = { labels, datasets };
  const options = { maintainAspectRatio: false, plugins: { legend: { display: true } } };
  return (
    <div style={{ height: '300px' }}>
      <Chart type="line" data={chartData} options={options} />
    </div>
  );
};

export default StrategyPreview;