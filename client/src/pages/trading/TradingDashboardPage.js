import React from 'react';
import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';
import ComingSoonOverlay from '../../components/ComingSoonOverlay';
import './TradingStyles.css';

const TradingDashboardPage = () => {
    const performanceData = {
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        datasets: [
            {
                label: 'Balance',
                data: [100, 105, 102, 110, 108, 115, 120],
                fill: true,
                backgroundColor: 'rgba(46, 204, 113, 0.2)',
                borderColor: '#2ECC71',
                tension: 0.4
            }
        ]
    };

    const performanceOptions = {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { ticks: { color: '#CCC' }, grid: { color: 'rgba(255,255,255,0.1)' } },
            y: { ticks: { color: '#CCC' }, grid: { color: 'rgba(255,255,255,0.1)' } }
        }
    };

    return (
        <div className="p-4 trading-page-container">
            <h1 className="text-2xl font-bold mb-4">Dashboard Trading</h1>
            <div className="grid">
                <div className="col-12 lg:col-8">
                    <Card title="Performance du Portefeuille" className="h-full">
                        <div style={{ position: 'relative', height: '300px' }}>
                            <Chart type="line" data={performanceData} options={performanceOptions} />
                        </div>
                    </Card>
                </div>
                <div className="col-12 lg:col-4">
                    <Card title="Indicateurs" className="h-full">
                        <div className="flex flex-column gap-2">
                            <div>Balance : 0 €</div>
                            <div>PnL : 0 €</div>
                            <div>Trades : 0</div>
                        </div>
                    </Card>
                </div>
                <div className="col-12 mt-4">
                    <Card title="Activité Récente" className="relative">
                        <ComingSoonOverlay />
                        <p className="placeholder-text">
                            Historique des opérations et performances détaillées à venir.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default TradingDashboardPage;