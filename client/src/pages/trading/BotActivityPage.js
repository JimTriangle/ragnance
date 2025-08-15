import React, { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { getBotStatus, startBot, stopBot } from '../../services/bot';
import './TradingStyles.css';

const BotActivityPage = () => {
    const [status, setStatus] = useState('STOPPED');
    const [loading, setLoading] = useState(false);

    const refreshStatus = () => {
        getBotStatus().then(data => setStatus(data.status));
    };

    useEffect(() => {
        refreshStatus();
    }, []);

    const handleStart = async () => {
        setLoading(true);
        try {
            const data = await startBot();
            setStatus(data.status);
        } finally {
            setLoading(false);
        }
    };

    const handleStop = async () => {
        setLoading(true);
        try {
            const data = await stopBot();
            setStatus(data.status);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 trading-page-container">
            <h1 className="text-2xl font-bold mb-4">Activité du Robot</h1>
            <div className="grid">
                <div className="col-12">
                    <Card title="Suivi en Temps Réel">
                        <p className="mb-3">Statut actuel : <strong>{status}</strong></p>
                    </Card>
                </div>
                <div className="col-12 mt-3">
                    <Button label="Démarrer" icon="pi pi-play" onClick={handleStart} disabled={loading || status === 'RUNNING'} className="mr-2" />
                    <Button label="Arrêter" icon="pi pi-stop" onClick={handleStop} disabled={loading || status === 'STOPPED'} className="p-button-danger" />
                </div>
            </div>
        </div>
  );
};

export default BotActivityPage;