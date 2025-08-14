import React from 'react';
import { Card } from 'primereact/card';
import ComingSoonOverlay from '../../components/ComingSoonOverlay';
import './TradingStyles.css';

const ApiConnectionsPage = () => (
    <div className="p-4 trading-page-container">
        <h1 className="text-2xl font-bold mb-4">Connexions API</h1>
        <Card className="relative">
            <ComingSoonOverlay />
            <p className="placeholder-text">Interface pour gérer les clés API de vos exchanges (Kraken, Binance...).</p>
        </Card>
    </div>
);

export default ApiConnectionsPage;