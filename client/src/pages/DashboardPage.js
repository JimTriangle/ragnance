import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import useTransactionRefresh from '../hooks/useTransactionRefresh';
import useTour from '../hooks/useTour';

// Imports PrimeReact
import { Chart } from 'primereact/chart';
import { Skeleton } from 'primereact/skeleton';

// Composants
import PurchaseForecast from '../components/PurchaseForecast';
import BudgetTracker from '../components/BudgetTracker';
import ProjectBudgetTracker from '../components/ProjectBudgetTracker';
import TourButton from '../components/TourButton';
import DisplaySettings from '../components/DisplaySettings';
import useChartTheme from '../hooks/useChartTheme';
import useDisplayPreferences from '../hooks/useDisplayPreferences';

// Styles
import '../styles/tour.css';
import '../styles/cards.css';

const DashboardPage = () => {
    // États du Dashboard
    const [summary, setSummary] = useState({ currentBalance: 0, projectedBalance: 0, totalProjectedIncome: 0, totalProjectedExpense: 0, projectedBalanceWithBudgets: 0, totalBudgets: 0 });
    const [monthlyBalanceData, setMonthlyBalanceData] = useState(null);
    const [categoryChartData, setCategoryChartData] = useState(null);
    const [budgetProgressData, setBudgetProgressData] = useState([]);
    const [projectBudgets, setProjectBudgets] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(false);
    
    const { showToast } = useContext(ToastContext);
    const { isLoggedIn, isLoading, authTimestamp } = useContext(AuthContext);
    const retryTimeoutRef = useRef(null);
    const retryAttemptsRef = useRef(0);
    const isMountedRef = useRef(true);

    // Configuration du guide utilisateur
    const tourSteps = [
        {
            element: '[data-tour-id="dashboard-title"]',
            popover: {
                title: 'Bienvenue sur le Dashboard ! 👋',
                description: 'Ce tableau de bord vous donne une vue d\'ensemble de votre situation financière. Découvrons ensemble les fonctionnalités principales.',
                side: 'bottom',
                align: 'start'
            }
        },
        {
            element: '[data-tour-id="card-balance"]',
            popover: {
                title: 'Solde Actuel 💰',
                description: 'Votre solde actuel en temps réel. Il reflète toutes vos transactions enregistrées jusqu\'à aujourd\'hui.',
                side: 'bottom',
                align: 'center'
            }
        },
        {
            element: '[data-tour-id="card-projected"]',
            popover: {
                title: 'Prévisions de Fin de Mois 📊',
                description: 'Visualisez votre solde prévisionnel basé sur vos transactions récurrentes et budgets. Si vous avez des budgets, vous verrez aussi le solde si tous les budgets sont remplis.',
                side: 'bottom',
                align: 'center'
            }
        },
        {
            element: '[data-tour-id="card-income-expense"]',
            popover: {
                title: 'Revenus & Dépenses 💵',
                description: 'Le résumé de vos revenus et dépenses prévus pour le mois en cours. Gardez un œil sur cet équilibre !',
                side: 'bottom',
                align: 'center'
            }
        },
        {
            element: '[data-tour-id="chart-daily"]',
            popover: {
                title: 'Solde Début de Mois 📈',
                description: 'Visualisez l\'évolution de votre solde en début de mois. Le graphique affiche les 3 derniers mois, le mois en cours et une projection sur 6 mois.',
                side: 'left',
                align: 'center'
            }
        },
        {
            element: '[data-tour-id="chart-category"]',
            popover: {
                title: 'Dépenses par Catégorie 🎯',
                description: 'Identifiez rapidement où va votre argent grâce à ce graphique en barres. Chaque couleur représente une catégorie de dépense.',
                side: 'left',
                align: 'center'
            }
        },
        {
            element: '[data-tour-id="budget-tracker"]',
            popover: {
                title: 'Suivi des Budgets Mensuels 🎯',
                description: 'Surveillez la progression de vos budgets mensuels. Les barres de progression vous indiquent combien vous avez dépensé par rapport à votre budget alloué.',
                side: 'top',
                align: 'center'
            }
        },
        {
            element: '[data-tour-id="project-budgets"]',
            popover: {
                title: 'Budgets de Projets 🚀',
                description: 'Gérez vos projets spécifiques avec des budgets dédiés. Parfait pour suivre les dépenses d\'un événement, d\'un voyage ou d\'un projet particulier.',
                side: 'top',
                align: 'center'
            }
        },
        {
            element: '[data-tour-id="purchase-forecast"]',
            popover: {
                title: 'Prévision d\'Achats 🛒',
                description: 'Planifiez vos futurs achats importants et voyez leur impact sur votre budget. Cela vous aide à anticiper et économiser.',
                side: 'top',
                align: 'center'
            }
        },
        {
            popover: {
                title: 'C\'est tout ! ✨',
                description: 'Vous pouvez à tout moment relancer ce guide en cliquant sur le bouton "i" en bas à droite de l\'écran. Bonne gestion financière !',
            }
        }
    ];

    // Utiliser le hook de tour
    const { startTour } = useTour('dashboard', tourSteps, true);

    // Options des graphiques (adaptées au thème clair/sombre)
    const { lineChartOptions, barChartOptions } = useChartTheme();

    // Préférences d'affichage des sections
    const DASHBOARD_SECTIONS = [
        { key: 'soldeActuel', label: 'Solde Actuel' },
        { key: 'soldeFinMois', label: 'Solde Fin de Mois' },
        { key: 'revenusDepenses', label: 'Revenus & Dépenses' },
        { key: 'chartSolde', label: 'Solde début de mois' },
        { key: 'chartCategories', label: 'Dépenses par Catégorie' },
        { key: 'budgetTracker', label: 'Suivi des Budgets' },
        { key: 'projectBudgets', label: 'Budgets de Projets' },
        { key: 'purchaseForecast', label: 'Prévision d\'Achats' },
    ];
    const { visibility, toggleSection, isVisible } = useDisplayPreferences('dashboard', {
        soldeActuel: true, soldeFinMois: true, revenusDepenses: true,
        chartSolde: true, chartCategories: true,
        budgetTracker: true, projectBudgets: true, purchaseForecast: true,
    });

    // Logique de récupération des données
    const fetchData = useCallback(async () => {
        if (!isLoggedIn || isLoading) {
            return false;
        }



        try {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;

            const [summaryResult, categoryStatsResult, budgetProgressResult, projectBudgetsResult] = await Promise.allSettled([
                api.get('/transactions/summary'),
                api.get('/transactions/stats/expenses-by-category'),
                api.get(`/budgets/progress/${year}/${month}`),
                api.get('/project-budgets')
            ]);

            if (!isMountedRef.current) return false;

            const encounteredErrors = [];

            if (summaryResult.status === 'fulfilled') {
                setSummary(summaryResult.value.data);
            } else {
                encounteredErrors.push('le résumé global');
            }

            if (categoryStatsResult.status === 'fulfilled') {
                const categories = Array.isArray(categoryStatsResult.value.data) ? categoryStatsResult.value.data : [];
                if (categories.length > 0) {
                    setCategoryChartData({
                        labels: categories.map(c => c.categoryName),
                        datasets: [{ label: 'Dépenses', data: categories.map(c => c.total), backgroundColor: categories.map(c => c.categoryColor) }]
                    });
                } else {
                    setCategoryChartData(null);
                }
            } else {
                encounteredErrors.push('les statistiques par catégorie');
            }

            if (budgetProgressResult.status === 'fulfilled') {
                setBudgetProgressData(budgetProgressResult.value.data);
            } else {
                encounteredErrors.push('le suivi des budgets');
            }

            if (projectBudgetsResult.status === 'fulfilled') {
                setProjectBudgets(projectBudgetsResult.value.data);
            } else {
                encounteredErrors.push('les budgets projet');
            }

            if (encounteredErrors.length > 0 && isMountedRef.current) {
                const details = encounteredErrors.join(', ');
                showToast('warn', 'Données partielles', `Certaines données n'ont pas pu être chargées : ${details}.`);
            }

            if (isMountedRef.current) {
                setDataLoaded(true);
            }
            
            return encounteredErrors.length === 0;
        } catch (error) {
            if (!isMountedRef.current) return false;
            showToast('error', 'Erreur', "Impossible de charger les données du dashboard.");
            
            // Même en cas d'erreur, on affiche le dashboard (avec données vides)
            if (isMountedRef.current) {
                setDataLoaded(true);
            }
            
            return false;
        }
    }, [showToast, isLoggedIn, isLoading]);

    const fetchMonthlyBalances = useCallback(async () => {
        if (!isLoggedIn || isLoading) {
            return;
        }

        try {
            const response = await api.get('/transactions/stats/monthly-balances');
            if (isMountedRef.current) {
                const data = response.data;
                const currentIndex = data.findIndex(m => m.isCurrent);

                const borderColors = data.map((_, i) => {
                    if (i < currentIndex) return '#2ECC71';
                    if (i === currentIndex) return '#27AE60';
                    return 'rgba(46, 204, 113, 0.5)';
                });

                setMonthlyBalanceData({
                    labels: data.map(m => m.label),
                    datasets: [{
                        label: 'Solde début de mois',
                        data: data.map(m => m.balance),
                        backgroundColor: 'rgba(46, 204, 113, 0.15)',
                        borderColor: '#2ECC71',
                        borderWidth: 2,
                        segment: {
                            borderDash: ctx => ctx.p0DataIndex >= currentIndex ? [5, 5] : [],
                            borderColor: ctx => ctx.p0DataIndex >= currentIndex ? 'rgba(46, 204, 113, 0.5)' : '#2ECC71'
                        },
                        fill: true,
                        tension: 0.3,
                        pointRadius: data.map((_, i) => i === currentIndex ? 6 : 4),
                        pointBackgroundColor: borderColors
                    }]
                });
            }
        } catch (error) {
        }
    }, [isLoggedIn, isLoading]);

    // Chargement initial AVEC écoute du changement d'authTimestamp
    useEffect(() => {
        isMountedRef.current = true;

        if (!isLoading && isLoggedIn) {
            fetchData();
            fetchMonthlyBalances();
        }

        return () => {
            isMountedRef.current = false;
        };
    }, [isLoggedIn, isLoading, authTimestamp, fetchData, fetchMonthlyBalances]);

    const refreshAfterTransaction = useCallback(async () => {
        if (isLoading || !isLoggedIn) {
            return;
        }
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }

        const success = await fetchData();
        await fetchMonthlyBalances();

        if (success) {
            retryAttemptsRef.current = 0;
            return;
        }

        if (retryAttemptsRef.current >= 3) {
            return;
        }

        retryAttemptsRef.current += 1;
        retryTimeoutRef.current = setTimeout(() => {
            retryTimeoutRef.current = null;
            refreshAfterTransaction();
        }, 2000);
    }, [fetchData, fetchMonthlyBalances, isLoading, isLoggedIn]);

    useTransactionRefresh(refreshAfterTransaction);

    useEffect(() => () => {
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
        }
        retryAttemptsRef.current = 0;
    }, []);

    const formatCurrency = (value) => (value || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

    // Afficher un skeleton pendant le chargement initial
    if (isLoading || !dataLoaded) {
        return (
            <div className="p-3">
                <Skeleton width="18rem" height="2rem" className="mb-4" />
                <div className="grid mt-2">
                    <div className="col-12 md:col-6 lg:col-4"><Skeleton height="8rem" /></div>
                    <div className="col-12 md:col-6 lg:col-4"><Skeleton height="8rem" /></div>
                    <div className="col-12 md:col-6 lg:col-4"><Skeleton height="8rem" /></div>
                </div>
                <div className="grid mt-4">
                    <div className="col-12 lg:col-6"><Skeleton height="20rem" /></div>
                    <div className="col-12 lg:col-6"><Skeleton height="20rem" /></div>
                </div>
                <div className="grid mt-4">
                    <div className="col-12 lg:col-4"><Skeleton height="12rem" /></div>
                    <div className="col-12 lg:col-4"><Skeleton height="12rem" /></div>
                    <div className="col-12 lg:col-4"><Skeleton height="12rem" /></div>
                </div>
            </div>
        );
    }

    // Formater le mois en cours pour l'affichage
    const currentDate = new Date();
    const currentMonthYear = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const formattedMonth = currentMonthYear.charAt(0).toUpperCase() + currentMonthYear.slice(1);

    return (
        <div className="p-3">
            <div className="flex justify-content-between align-items-center">
                <h1 className="text-2xl font-bold" data-tour-id="dashboard-title">Dashboard Budget - {formattedMonth}</h1>
                <DisplaySettings sections={DASHBOARD_SECTIONS} visibility={visibility} onToggle={toggleSection} />
            </div>

            {/* Bouton pour relancer le guide */}
            <TourButton onStartTour={startTour} tooltip="Revoir le guide du Dashboard" />
            {(isVisible('soldeActuel') || isVisible('soldeFinMois') || isVisible('revenusDepenses')) && (
            <div className="grid mt-2">
                {isVisible('soldeActuel') && (
                <div className="col-12 md:col-6 lg:col-4" data-tour-id="card-balance">
                    <div className="kpi-modern">
                        <div className="kpi-modern__icon" style={{ background: 'rgba(46, 204, 113, 0.12)', color: '#2ECC71' }}>
                            <i className="pi pi-wallet"></i>
                        </div>
                        <span className="kpi-modern__label">Solde Actuel</span>
                        <span className="kpi-modern__value" style={{ color: summary.currentBalance >= 0 ? 'var(--green-400)' : 'var(--red-400)' }}>
                            {formatCurrency(summary.currentBalance)}
                        </span>
                        <span className="kpi-modern__sub">Au {new Date().toLocaleDateString('fr-FR')}</span>
                    </div>
                </div>
                )}
                {isVisible('soldeFinMois') && (
                <div className="col-12 md:col-6 lg:col-4" data-tour-id="card-projected">
                    <div className="kpi-modern">
                        <div className="kpi-modern__icon" style={{ background: 'rgba(52, 152, 219, 0.12)', color: '#3498DB' }}>
                            <i className="pi pi-chart-line"></i>
                        </div>
                        <span className="kpi-modern__label">Solde Fin de Mois</span>
                        <span className="kpi-modern__value">{formatCurrency(summary.projectedBalance)}</span>
                        {summary.totalBudgets > 0 && (
                            <span className={`kpi-modern__sub ${summary.projectedBalanceWithBudgets >= 0 ? 'kpi-modern__sub--positive' : 'kpi-modern__sub--negative'}`}>
                                Si budgets remplis : {formatCurrency(summary.projectedBalanceWithBudgets)}
                            </span>
                        )}
                        {!summary.totalBudgets && <span className="kpi-modern__sub">Basé sur transactions</span>}
                    </div>
                </div>
                )}
                {isVisible('revenusDepenses') && (
                <div className="col-12 md:col-6 lg:col-4" data-tour-id="card-income-expense">
                    <div className="kpi-modern">
                        <div className="kpi-modern__icon" style={{ background: 'rgba(155, 89, 182, 0.12)', color: '#9B59B6' }}>
                            <i className="pi pi-sort-alt"></i>
                        </div>
                        <span className="kpi-modern__label">Revenus & Dépenses</span>
                        <span className="kpi-modern__value kpi-modern__sub--positive">{formatCurrency(summary.totalProjectedIncome)}</span>
                        <span className="kpi-modern__sub kpi-modern__sub--negative">Dépenses : {formatCurrency(summary.totalProjectedExpense)}</span>
                    </div>
                </div>
                )}
            </div>
            )}
            {(isVisible('chartSolde') || isVisible('chartCategories')) && (
            <div className="grid mt-4">
                {isVisible('chartSolde') && (
                <div className="col-12 lg:col-6" data-tour-id="chart-daily">
                    <div className="chart-card h-full">
                        <div className="chart-card__header">
                            <div>
                                <h2 className="chart-card__title">Solde début de mois</h2>
                                <p className="chart-card__subtitle">3 derniers mois + 6 mois de projection</p>
                            </div>
                        </div>
                        <div style={{ position: 'relative', height: '150px' }}>
                            {monthlyBalanceData ? (
                                <Chart type="line" data={monthlyBalanceData} options={lineChartOptions} aria-label="Graphique d'évolution du solde début de mois" />
                            ) : (
                                <Skeleton height="100%" />
                            )}
                        </div>
                    </div>
                </div>
                )}
                {isVisible('chartCategories') && (
                <div className="col-12 lg:col-6" data-tour-id="chart-category">
                    <div className="chart-card h-full">
                        <div className="chart-card__header">
                            <h2 className="chart-card__title">Dépenses par Catégorie — {formattedMonth}</h2>
                        </div>
                        {categoryChartData && categoryChartData.labels.length > 0 ? (
                            <div style={{ position: 'relative', height: '150px' }}>
                                <Chart type="bar" data={categoryChartData} options={barChartOptions} aria-label="Graphique des dépenses par catégorie" />
                            </div>
                        ) : (
                            <div className="card-empty" style={{ height: '150px' }}>
                                <i className="pi pi-chart-bar card-empty__icon"></i>
                                <p className="card-empty__text">Aucune dépense catégorisée</p>
                                <p className="card-empty__text" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Ajoutez des transactions avec des catégories pour visualiser la répartition.</p>
                            </div>
                        )}
                    </div>
                </div>
                )}
            </div>
            )}
            {(isVisible('budgetTracker') || isVisible('projectBudgets') || isVisible('purchaseForecast')) && (
            <div className="grid mt-4">
                {isVisible('budgetTracker') && (
                <div className="col-12 lg:col-4" data-tour-id="budget-tracker">
                    <div className="chart-card h-full">
                        <div className="chart-card__header">
                            <h2 className="chart-card__title">Suivi des Budgets Mensuels</h2>
                        </div>
                        <BudgetTracker data={budgetProgressData} />
                    </div>
                </div>
                )}
                {isVisible('projectBudgets') && (
                <div className="col-12 lg:col-4" data-tour-id="project-budgets">
                    <ProjectBudgetTracker budgets={projectBudgets} />
                </div>
                )}
                {isVisible('purchaseForecast') && (
                <div className="col-12 lg:col-4" data-tour-id="purchase-forecast">
                    <PurchaseForecast onUpdate={fetchData} />
                </div>
                )}
            </div>
            )}
        </div>
    );
};

export default DashboardPage;