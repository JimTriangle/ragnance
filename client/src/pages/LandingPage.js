import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import './LandingPage.css';
import ThemeToggle from '../components/ThemeToggle';
import Footer from '../components/Footer';

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
                <div className="flex justify-content-end">
                    <ThemeToggle />
                </div>
                <img src="/logo192.png" alt="Ragnance Logo" className="logo" />
                <h1>Bienvenue sur Ragnance</h1>
                <p className="subtitle">Vos finances, deux approches, une seule plateforme.</p>
                <Button label="Commencer maintenant" icon="pi pi-arrow-right" iconPos="right" onClick={() => handleAccessClick('/budget/dashboard')} className="p-button-raised p-button-lg mt-3" />
            </header>

            <main className="landing-main">
                {/* SECTION DES CHOIX PRINCIPAUX */}
                <section className="features">
                    <h2>Gérez votre budget</h2>
                    <div className="grid">
                        <div className="col-12 md:col-8 md:col-offset-2 lg:col-6 lg:col-offset-3">
                            <Card title="Ragnance Budget">
                                <i className="pi pi-wallet feature-icon"></i>
                                <p>Prenez le contrôle de vos finances personnelles avec un suivi simple et efficace de vos dépenses et revenus.</p>
                                <Button label="Accéder à Budget" onClick={() => handleAccessClick('/budget/dashboard')} className="p-button-raised" />
                            </Card>
                        </div>
                        {/* MASQUÉ: Accès au trading désactivé */}
                        {/* <div className="col-12 md:col-6">
                            <Card title="Ragnance Trading">
                                <i className="pi pi-chart-line feature-icon"></i>
                                <p>Analysez les marchés, développez et automatisez vos stratégies de trading avec des outils avancés.</p>
                                <Button label="Accéder à Trading" onClick={() => handleAccessClick('/trading')} className="p-button-raised" />
                            </Card>
                        </div> */}
                    </div>
                </section>

                {/* RÉINTÉGRATION DES SECTIONS DE PRÉSENTATION */}
                <section className="tips">
                    <h2>Comment ça marche ?</h2>
                    <p className="text-center" style={{ maxWidth: '800px', margin: '0 auto 2rem auto', color: 'var(--text-color-secondary)' }}>
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
                        <li>💡 <strong>Budgets Projet :</strong> Idéal pour suivre les dépenses d'un événement ponctuel comme des vacances ou des travaux.</li>
                        <li>🛒 <strong>Prévisionnel d'Achats :</strong> Ajoutez vos articles, et une fois achetés, ils se transforment automatiquement en transaction.</li>
                        <li>🔄 <strong>Transactions Récurrentes :</strong> Gagnez du temps en configurant vos charges fixes (loyer, abonnements...).</li>
                    </ul>
                </section>

                <section className="security-section">
                    <h2>Sécurité et Confidentialité</h2>
                    <p className="text-center" style={{ maxWidth: '800px', margin: '0 auto 2rem auto', color: 'var(--text-color-secondary)' }}>
                        Vos données financières sont précieuses. Ragnance met en œuvre les meilleures pratiques de sécurité pour protéger vos informations.
                    </p>
                    <div className="security-badges">
                        <Card className="security-badge-card">
                            <div className="security-badge-content">
                                <i className="pi pi-shield security-badge-icon"></i>
                                <div className="security-badge-grade">A+</div>
                                <h4>Security Headers</h4>
                                <p>Note maximale sur securityheaders.com</p>
                            </div>
                        </Card>
                        <Card className="security-badge-card">
                            <div className="security-badge-content">
                                <i className="pi pi-lock security-badge-icon"></i>
                                <h4>Chiffrement HTTPS</h4>
                                <p>Toutes les communications sont sécurisées</p>
                            </div>
                        </Card>
                        <Card className="security-badge-card">
                            <div className="security-badge-content">
                                <i className="pi pi-eye-slash security-badge-icon"></i>
                                <h4>Confidentialité</h4>
                                <p>Vos données restent privées et sous votre contrôle</p>
                            </div>
                        </Card>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default LandingPage;