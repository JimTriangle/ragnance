import React from 'react';
import { Card } from 'primereact/card';
import ComingSoonOverlay from '../../components/ComingSoonOverlay';
import './TradingStyles.css';

const SimulationPage = () => (
    <div className="p-4 trading-page-container">
        <h1 className="text-2xl font-bold mb-4">Simulation de Trading</h1>
        <Card className="relative">
            <ComingSoonOverlay />
            <p className="placeholder-text">Lancez des simulations basées sur vos stratégies configurées.</p>
        </Card>
    </div>
);

export default SimulationPage;