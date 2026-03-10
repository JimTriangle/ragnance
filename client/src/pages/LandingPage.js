import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import './LandingPage.css';
import ThemeToggle from '../components/ThemeToggle';
import Footer from '../components/Footer';

const LandingPage = () => {
    const navigate = useNavigate();

    const handleAccessClick = (destination) => {
        sessionStorage.setItem('postLoginRedirect', destination);
        navigate('/login');
    };

    return (
        <div className="landing-container">
            {/* HERO */}
            <header className="landing-hero">
                <div className="landing-hero-toggle">
                    <ThemeToggle />
                </div>
                <div className="landing-hero-bg" aria-hidden="true">
                    <div className="landing-hero-orb landing-hero-orb--1"></div>
                    <div className="landing-hero-orb landing-hero-orb--2"></div>
                    <div className="landing-hero-orb landing-hero-orb--3"></div>
                </div>
                <div className="landing-hero-content">
                    <img src="/logo192.png" alt="Ragnance Logo" className="landing-hero-logo" />
                    <h1 className="landing-hero-title">
                        Bienvenue sur <span className="landing-hero-brand">Ragnance</span>
                    </h1>
                    <p className="landing-hero-subtitle">
                        Vos finances, simplifiées et maîtrisées.
                    </p>
                    <Button
                        label="Commencer maintenant"
                        icon="pi pi-arrow-right"
                        iconPos="right"
                        onClick={() => handleAccessClick('/budget/dashboard')}
                        className="btn-modern landing-hero-cta"
                    />
                </div>
            </header>

            <main className="landing-main">
                {/* FEATURE PRINCIPALE */}
                <section className="landing-section">
                    <h2 className="landing-section-title">Gérez votre budget</h2>
                    <p className="landing-section-desc">
                        Prenez le contrôle de vos finances personnelles avec un suivi simple et efficace.
                    </p>
                    <div className="landing-feature-highlight" onClick={() => handleAccessClick('/budget/dashboard')}>
                        <div className="landing-feature-highlight-icon">
                            <i className="pi pi-wallet"></i>
                        </div>
                        <div className="landing-feature-highlight-body">
                            <h3>Ragnance Budget</h3>
                            <p>Suivez vos dépenses et revenus, définissez des budgets, analysez vos habitudes financières et atteignez vos objectifs d'épargne.</p>
                            <Button
                                label="Accéder à Budget"
                                icon="pi pi-arrow-right"
                                iconPos="right"
                                className="btn-modern btn-modern--outlined landing-feature-highlight-btn"
                            />
                        </div>
                    </div>
                </section>

                {/* COMMENT ÇA MARCHE */}
                <section className="landing-section">
                    <h2 className="landing-section-title">Comment ça marche ?</h2>
                    <p className="landing-section-desc">
                        Ragnance Budget est conçu pour être intuitif. Voici les étapes clés pour bien démarrer.
                    </p>
                    <div className="landing-steps">
                        <div className="landing-step">
                            <div className="landing-step-number">1</div>
                            <div className="landing-step-icon">
                                <i className="pi pi-wallet"></i>
                            </div>
                            <h4>Centralisez</h4>
                            <p>Enregistrez toutes vos transactions, qu'elles soient ponctuelles ou récurrentes.</p>
                        </div>
                        <div className="landing-step-connector" aria-hidden="true">
                            <i className="pi pi-chevron-right"></i>
                        </div>
                        <div className="landing-step">
                            <div className="landing-step-number">2</div>
                            <div className="landing-step-icon">
                                <i className="pi pi-calendar"></i>
                            </div>
                            <h4>Planifiez</h4>
                            <p>Définissez des budgets mensuels pour vos catégories de dépenses et suivez votre progression.</p>
                        </div>
                        <div className="landing-step-connector" aria-hidden="true">
                            <i className="pi pi-chevron-right"></i>
                        </div>
                        <div className="landing-step">
                            <div className="landing-step-number">3</div>
                            <div className="landing-step-icon">
                                <i className="pi pi-chart-bar"></i>
                            </div>
                            <h4>Analysez</h4>
                            <p>Comprenez où va votre argent grâce aux graphiques et recevez des suggestions pour optimiser.</p>
                        </div>
                    </div>
                </section>

                {/* ASTUCES */}
                <section className="landing-section">
                    <h2 className="landing-section-title">Astuces d'utilisation</h2>
                    <div className="landing-tips-grid">
                        <div className="landing-tip-card">
                            <div className="landing-tip-icon">
                                <i className="pi pi-folder"></i>
                            </div>
                            <h4>Budgets Projet</h4>
                            <p>Idéal pour suivre les dépenses d'un événement ponctuel comme des vacances ou des travaux.</p>
                        </div>
                        <div className="landing-tip-card">
                            <div className="landing-tip-icon">
                                <i className="pi pi-shopping-cart"></i>
                            </div>
                            <h4>Prévisionnel d'Achats</h4>
                            <p>Ajoutez vos articles, et une fois achetés, ils se transforment automatiquement en transaction.</p>
                        </div>
                        <div className="landing-tip-card">
                            <div className="landing-tip-icon">
                                <i className="pi pi-sync"></i>
                            </div>
                            <h4>Transactions Récurrentes</h4>
                            <p>Gagnez du temps en configurant vos charges fixes : loyer, abonnements, assurances...</p>
                        </div>
                    </div>
                </section>

                {/* SÉCURITÉ */}
                <section className="landing-section">
                    <h2 className="landing-section-title">Sécurité et Confidentialité</h2>
                    <p className="landing-section-desc">
                        Vos données financières sont précieuses. Ragnance met en oeuvre les meilleures pratiques de sécurité pour protéger vos informations.
                    </p>
                    <div className="landing-security-grid">
                        <div className="landing-security-card">
                            <i className="pi pi-shield landing-security-icon"></i>
                            <div className="landing-security-grade">A+</div>
                            <h4>Security Headers</h4>
                            <p>Note maximale sur securityheaders.com</p>
                        </div>
                        <div className="landing-security-card">
                            <i className="pi pi-lock landing-security-icon"></i>
                            <h4>Chiffrement HTTPS</h4>
                            <p>Toutes les communications sont sécurisées</p>
                        </div>
                        <div className="landing-security-card">
                            <i className="pi pi-eye-slash landing-security-icon"></i>
                            <h4>Confidentialité</h4>
                            <p>Vos données restent privées et sous votre contrôle</p>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default LandingPage;
