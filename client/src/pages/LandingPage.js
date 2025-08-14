import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import './LandingPage.css'; // Nous créerons ce fichier CSS juste après

const LandingPage = () => {
    return (
        <div className="landing-container">
            <header className="landing-header">
                {/* Remplacez 'URL_DE_VOTRE_LOGO' par le lien de l'image ci-dessus */}
                <img src="/logo512.png" alt="Ragnance Logo" className="logo" />
                <h1>Bienvenue sur Ragnance</h1>
                <p className="subtitle">Prenez le contrôle de vos finances personnelles, simplement.</p>
                <div className="header-actions">
                    <Link to="/login">
                        <Button label="Se Connecter" icon="pi pi-sign-in" className="p-button-raised" />
                    </Link>
                </div>
            </header>

            <main className="landing-main">
                <section className="features">
                    <h2>Comment ça marche ?</h2>
                    <div className="grid">
                        <div className="col-12 md:col-4">
                            <Card title="1. Centralisez">
                                <i className="pi pi-wallet feature-icon"></i>
                                <p>Enregistrez toutes vos transactions, qu'elles soient ponctuelles ou récurrentes. Ne laissez plus aucune dépense vous échapper.</p>
                            </Card>
                        </div>
                        <div className="col-12 md:col-4">
                            <Card title="2. Planifiez">
                                <i className="pi pi-calendar feature-icon"></i>
                                <p>Définissez des budgets mensuels pour vos catégories de dépenses et suivez votre progression en temps réel pour ne jamais dépasser vos limites.</p>
                            </Card>
                        </div>
                        <div className="col-12 md:col-4">
                            <Card title="3. Analysez">
                                <i className="pi pi-chart-bar feature-icon"></i>
                                <p>Grâce à des graphiques clairs et des analyses intelligentes, comprenez où va votre argent et recevez des suggestions pour optimiser vos budgets.</p>
                            </Card>
                        </div>
                    </div>
                </section>

                <section className="tips">
                    <h2>Astuces d'utilisation</h2>
                    <ul>
                        <li>💡 **Utilisez les Budgets Projet :** Idéal pour suivre les dépenses d'un événement ponctuel comme des vacances ou des travaux.</li>
                        <li>🛒 **La Liste de Courses Intelligente :** Ajoutez vos articles, et une fois achetés, ils se transforment automatiquement en transaction de dépense.</li>
                        <li>🔄 **Transactions Récurrentes :** Gagnez du temps en configurant vos charges fixes (loyer, abonnements...). Elles seront prises en compte automatiquement chaque mois.</li>
                    </ul>
                </section>
                <section className="new-project-section">
                    <h2>Bientôt : Ragnance Trading 📈</h2>
                    <div className="new-project-card">
                        <i className="pi pi-chart-line project-icon"></i>
                        <div className="project-details">
                            <h3>Le trading et l'analyse de marché, simplifiés.</h3>
                            <p>
                                Découvrez notre nouvelle plateforme dédiée au trading automatisé.
                                Connectez-vous à vos exchanges, analysez les tendances avec des indicateurs avancés
                                et déployez vos propres stratégies.
                            </p>
                            <Button label="En savoir plus (Bientôt disponible)" disabled />
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default LandingPage;