import React from 'react';

const SummaryTable = ({ robots, backtests }) => (
  <table className="summary-table w-full">
    <thead>
      <tr>
        <th>Nom</th>
        <th>Type</th>
        <th>Statut</th>
        <th>PnL 24h</th>
        <th>PnL total</th>
        <th>Sharpe</th>
        <th>Dernier événement</th>
      </tr>
    </thead>
    <tbody>
      {robots.map(r => (
        <tr key={r.id}>
          <td>{r.name}</td>
          <td>Robot</td>
          <td>{r.status}</td>
          <td>{r.pnl24h}</td>
          <td>{r.pnlTotal}</td>
          <td>{r.sharpe}</td>
          <td>{r.lastEventAt}</td>
        </tr>
      ))}
      {backtests.map(b => (
        <tr key={b.id}>
          <td>{b.strategy}</td>
          <td>Backtest</td>
          <td>-</td>
          <td>-</td>
          <td>{b.pnlTotal}</td>
          <td>{b.sharpe}</td>
          <td>{b.endedAt}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default SummaryTable;