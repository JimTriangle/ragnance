import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();

    // Cette fonction retient la destination et redirige vers la page de connexion
    const handleAccessClick = (destination) => {
        // On sauvegarde la destination dans la session du navigateur
        sessionStorage.setItem('postLoginRedirect', destination);
        // On envoie l'utilisateur se connecter
        navigate('/login');
    };

    return (
        <div className="landing-container">
            <header className="landing-header">
                <img src="/logo192.png" alt="Ragnance Logo" className="logo" />
                <h1>Bienvenue sur Ragnance</h1>
                <p className="subtitle">Vos finances, deux approches, une seule plateforme.</p>
                {/* Le bouton de connexion direct a été retiré */}
            </header>

            <main className="landing-main">
                {/* SECTION DES CHOIX PRINCIPAUX */}
                <section className="features">
                    <h2>Choisissez votre outil</h2>
                    <div className="grid">
                        <div className="col-12 md:col-6">
                            <Card title="Ragnance Budget">
                                <i className="pi pi-wallet feature-icon"></i>
                                <p>Prenez le contrôle de vos finances personnelles avec un suivi simple et efficace de vos dépenses et revenus.</p>
                                <Button label="Accéder à Budget" onClick={() => handleAccessClick('/budget/dashboard')} className="p-button-raised" />
                            </Card>
                        </div>
                        <div className="col-12 md:col-6">
                            <Card title="Ragnance Trading">
                                <i className="pi pi-chart-line feature-icon"></i>
                                <p>Analysez les marchés, développez et automatisez vos stratégies de trading avec des outils avancés.</p>
                                <Button label="Accéder à Trading" onClick={() => handleAccessClick('/trading')} className="p-button-raised" />
                            </Card>
                        </div>
                    </div>
                </section>

                {/* RÉINTÉGRATION DES SECTIONS DE PRÉSENTATION */}
                <section className="tips">
                    <h2>Comment ça marche ?</h2>
                    <p className="text-center" style={{maxWidth: '800px', margin: '0 auto 2rem auto', color: '#b0b0d0'}}>
                        Ragnance Budget est conçu pour être intuitif. Voici les étapes clés pour bien démarrer :
                    </p>
                    <div className="grid">
                        <div className="col-12 md:col-4">
                            <Card>
                                <h4>1. Centralisez</h4>
                                <i className="pi pi-wallet feature-icon"></i>
                                <p>Enregistrez toutes vos transactions, qu'elles soient ponctuelles ou récurrentes.</p>
                            </Card>
                        </div>
                        <div className="col-12 md:col-4">
                            <Card>
                                <h4>2. Planifiez</h4>
                                <i className="pi pi-calendar feature-icon"></i>
                                <p>Définissez des budgets mensuels pour vos catégories de dépenses et suivez votre progression.</p>
                            </Card>
                        </div>
                        <div className="col-12 md:col-4">
                            <Card>
                                <h4>3. Analysez</h4>
                                <i className="pi pi-chart-bar feature-icon"></i>
                                <p>Comprenez où va votre argent grâce aux graphiques et recevez des suggestions pour optimiser.</p>
                            </Card>
                        </div>
                    </div>
                </section>

                <section className="tips">
                    <h2>Astuces d'utilisation</h2>
                    <ul>
                        <li>💡 **Budgets Projet :** Idéal pour suivre les dépenses d'un événement ponctuel comme des vacances ou des travaux.</li>
                        <li>🛒 **Prévisionnel d'Achats :** Ajoutez vos articles, et une fois achetés, ils se transforment automatiquement en transaction.</li>
                        <li>🔄 **Transactions Récurrentes :** Gagnez du temps en configurant vos charges fixes (loyer, abonnements...).</li>
                    </ul>
                </section>
            </main>
        </div>
    );
};

export default LandingPage;