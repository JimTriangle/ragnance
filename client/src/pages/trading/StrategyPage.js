import React, { useState } from 'react';
import { Card } from 'primereact/card';

import axios from 'axios';
import './TradingStyles.css';

const sampleDSL = {
  inputs: {
    emaShortLength: 20,
    emaLongLength: 50,
    rsiLength: 14,
    adxLength: 14,
    adxTrendThreshold: 20
  },
  indicators: [
    { id: 'emaShort', fn: 'EMA', source: 'close', params: { length: '$emaShortLength' } },
    { id: 'emaLong', fn: 'EMA', source: 'close', params: { length: '$emaLongLength' } },
    { id: 'RSI', fn: 'RSI', source: 'close', params: { length: '$rsiLength' } },
    { id: 'ADX', fn: 'ADX', params: { length: '$adxLength' } }
  ],
  rules: {
    debutHausse: ['AND',
      ['CROSSOVER', 'emaShort', 'emaLong'],
      ['>', 'RSI', 50],
      ['>', 'ADX.adx', '$adxTrendThreshold']
    ],
    finHausse: ['AND',
      ['CROSSUNDER', 'RSI', 50],
      ['<', 'emaShort', 'emaLong']
    ]
  },
  entries: [ { name: 'longEntry', when: 'debutHausse', side: 'LONG' } ],
  exits: [ { name: 'longExit', when: 'finHausse', side: 'LONG' } ]
};

const StrategyPage = () => {
  const [dsl, setDsl] = useState(JSON.stringify(sampleDSL, null, 2));
  const [signals, setSignals] = useState([]);
  const handlePreview = async () => {
    try {
      const res = await axios.post('/api/strategies/preview', {
        kind: 'RULES_ENGINE',
        params: JSON.parse(dsl),
        ohlcv: []
      });
      setSignals(res.data.signals || []);
    } catch (e) {
      console.error('Preview failed', e);
    }
  };
  return (
    <div className="p-4 trading-page-container">
    <h1 className="text-2xl font-bold mb-4">Stratégie du Robot</h1>
      <Card className="relative p-3">
        <textarea value={dsl} onChange={e => setDsl(e.target.value)} rows={20} style={{ width: '100%' }} />
        <button onClick={handlePreview} className="p-button mt-2">Aperçu</button>
        {signals.length > 0 && (
          <pre className="mt-2 overflow-auto" style={{ maxHeight: 200 }}>{JSON.stringify(signals, null, 2)}</pre>
        )}
      </Card>
    </div>

      );
};

export default StrategyPage;