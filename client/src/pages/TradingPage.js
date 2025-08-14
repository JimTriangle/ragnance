import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import './TradingPage.css'; // On va créer ce fichier juste après

const TradingPage = () => {
    
    const ComingSoonOverlay = () => (
        <div className="coming-soon-overlay">
            <span>Bientôt disponible</span>
        </div>
    );

    return (
        <div className="p-4 trading-page-container">
            <div className="flex justify-content-between align-items-center mb-4">
                <h1 className="text-2xl font-bold m-0">Ragnance Trading</h1>
                <Button label="Connecter un Exchange" icon="pi pi-key" disabled />
            </div>

            <div className="grid">
                {/* Section principale pour le graphique de marché */}
                <div className="col-12 lg:col-8">
                    <Card title="Analyse de Marché" className="h-full relative">
                        <ComingSoonOverlay />
                        <p className="placeholder-text">Ici s'affichera le graphique principal avec les chandeliers japonais, les volumes et les indicateurs techniques (RSI, MACD, Bandes de Bollinger...).</p>
                    </Card>
                </div>

                {/* Section latérale pour les informations et actions */}
                <div className="col-12 lg:col-4">
                    <Card title="Panel de Contrôle" className="h-full relative">
                         <ComingSoonOverlay />
                        <p className="placeholder-text">Cette zone contiendra les options de sélection des actifs (ex: BTC/EUR), les indicateurs à afficher, et les boutons pour passer des ordres.</p>
                    </Card>
                </div>

                {/* Section pour les stratégies et le statut */}
                <div className="col-12 mt-4">
                    <Card title="Vos Stratégies de Trading Automatisé">
                        <div className="grid">
                            <div className="col-12 md:col-6 relative">
                                <Card subTitle="Statut des Bots">
                                    <ComingSoonOverlay />
                                    <p className="placeholder-text">Suivi en temps réel de vos stratégies actives, P&L, et derniers trades exécutés.</p>
                                </Card>
                            </div>
                            <div className="col-12 md:col-6 relative">
                                <Card subTitle="Éditeur de Stratégie">
                                    <ComingSoonOverlay />
                                    <p className="placeholder-text">Interface pour construire, tester et déployer de nouvelles stratégies de trading basées sur des indicateurs.</p>
                                </Card>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default TradingPage;