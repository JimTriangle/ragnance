import React from 'react';
import { Card } from 'primereact/card';
import ComingSoonOverlay from '../../components/ComingSoonOverlay';
import './TradingStyles.css';

const StrategyPage = () => (
    <div className="p-4 trading-page-container">
        <h1 className="text-2xl font-bold mb-4">Stratégie du Robot</h1>
        <Card className="relative">
            <ComingSoonOverlay />
            <p className="placeholder-text">Définissez et paramétrez les stratégies de trading automatisées.</p>
        </Card>
    </div>
);

export default StrategyPage;