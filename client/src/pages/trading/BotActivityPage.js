import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import ComingSoonOverlay from '../../components/ComingSoonOverlay';
import './TradingStyles.css';

const BotActivityPage = () => (
    <div className="p-4 trading-page-container">
        <h1 className="text-2xl font-bold mb-4">Activité du Robot</h1>
        <div className="grid">
            <div className="col-12">
                <Card title="Suivi en Temps Réel" className="relative">
                    <ComingSoonOverlay />
                    <p className="placeholder-text">Visualisation en direct des trades et du statut du bot.</p>
                </Card>
            </div>
            <div className="col-12 mt-3">
                <Button label="Démarrer" icon="pi pi-play" disabled className="mr-2" />
                <Button label="Arrêter" icon="pi pi-stop" disabled className="p-button-danger" />
            </div>
        </div>
    </div>
);

export default BotActivityPage;