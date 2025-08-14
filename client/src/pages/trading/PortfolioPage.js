import React from 'react';
import { Card } from 'primereact/card';
import ComingSoonOverlay from '../../components/ComingSoonOverlay';
import './TradingStyles.css';

const PortfolioPage = () => (
    <div className="p-4 trading-page-container">
        <h1 className="text-2xl font-bold mb-4">Portefeuilles</h1>
        <Card className="relative">
            <ComingSoonOverlay />
            <p className="placeholder-text">Gestion des allocations par exchange, budgets et paires sélectionnées.</p>
        </Card>
    </div>
);

export default PortfolioPage;