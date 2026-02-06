import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import useTransactionRefresh from '../hooks/useTransactionRefresh';
import useTour from '../hooks/useTour';

// Imports PrimeReact
import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';

// Composants
import PurchaseForecast from '../components/PurchaseForecast';
import BudgetTracker from '../components/BudgetTracker';
import ProjectBudgetTracker from '../components/ProjectBudgetTracker';
import TourButton from '../components/TourButton';

// Styles du tour
import '../styles/tour.css';

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
                description: 'Identifiez rapidement où va votre argent grâce à ce graphique circulaire. Chaque couleur représente une catégorie de dépense.',
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

    // Options des graphiques
    const lineChartOptions = {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { ticks: { color: '#CCC' }, grid: { color: 'rgba(255,255,255,0.1)' } },
            y: { ticks: { color: '#CCC', callback: (value) => value.toLocaleString('fr-FR') + ' €' }, grid: { color: 'rgba(255,255,255,0.1)' } }
        }
    };
    const pieChartOptions = {
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#CCC' } } }
    };

    // Logique de récupération des données
    const fetchData = useCallback(async () => {
        if (!isLoggedIn || isLoading) {
            return false;
        }

        console.log('🔄 Chargement des données du dashboard...');

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

            console.log('🔍 Résultats des requêtes API:', {
                summary: summaryResult.status,
                categoryStats: categoryStatsResult.status,
                budgetProgress: budgetProgressResult.status,
                projectBudgets: projectBudgetsResult.status
            });

            if (!isMountedRef.current) return false;

            const encounteredErrors = [];

            if (summaryResult.status === 'fulfilled') {
                console.log('📊 Résumé reçu:', summaryResult.value.data);
                setSummary(summaryResult.value.data);
            } else {
                console.log('❌ Échec résumé - Status:', summaryResult.reason?.response?.status, 'Message:', summaryResult.reason?.message);
                console.log('❌ Détails complets résumé:', summaryResult.reason);
                encounteredErrors.push('le résumé global');
            }

            if (categoryStatsResult.status === 'fulfilled') {
                const categories = Array.isArray(categoryStatsResult.value.data) ? categoryStatsResult.value.data : [];
                console.log('📈 Catégories reçues:', categories);
                if (categories.length > 0) {
                    setCategoryChartData({
                        labels: categories.map(c => c.categoryName),
                        datasets: [{ data: categories.map(c => c.total), backgroundColor: categories.map(c => c.categoryColor) }]
                    });
                } else {
                    setCategoryChartData(null);
                }
            } else {
                console.log('❌ Échec catégories - Status:', categoryStatsResult.reason?.response?.status, 'Message:', categoryStatsResult.reason?.message);
                console.log('❌ Détails complets catégories:', categoryStatsResult.reason);
                encounteredErrors.push('les statistiques par catégorie');
            }

            if (budgetProgressResult.status === 'fulfilled') {
                console.log('💰 Budgets progress reçus:', budgetProgressResult.value.data);
                setBudgetProgressData(budgetProgressResult.value.data);
            } else {
                console.log('❌ Échec budgets progress - Status:', budgetProgressResult.reason?.response?.status, 'Message:', budgetProgressResult.reason?.message);
                console.log('❌ Détails complets budgets progress:', budgetProgressResult.reason);
                encounteredErrors.push('le suivi des budgets');
            }

            if (projectBudgetsResult.status === 'fulfilled') {
                console.log('🎯 Budgets projets reçus:', projectBudgetsResult.value.data);
                setProjectBudgets(projectBudgetsResult.value.data);
            } else {
                console.log('❌ Échec budgets projets - Status:', projectBudgetsResult.reason?.response?.status, 'Message:', projectBudgetsResult.reason?.message);
                console.log('❌ Détails complets budgets projets:', projectBudgetsResult.reason);
                encounteredErrors.push('les budgets projet');
            }

            if (encounteredErrors.length > 0 && isMountedRef.current) {
                const details = encounteredErrors.join(', ');
                showToast('warn', 'Données partielles', `Certaines données n'ont pas pu être chargées : ${details}.`);
            }

            if (isMountedRef.current) {
                setDataLoaded(true);
                console.log('✅ Données du dashboard chargées avec succès - dataLoaded mis à true');
            }
            
            return encounteredErrors.length === 0;
        } catch (error) {
            if (!isMountedRef.current) return false;
            console.error('❌ Erreur inattendue lors du chargement du dashboard :', error);
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
            console.log('🔄 Chargement des soldes mensuels...');
            const response = await api.get('/transactions/stats/monthly-balances');
            console.log('📉 Soldes mensuels reçus:', response.data);
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
            console.log("❌ Erreur fetch monthly balances - Status:", error?.response?.status, 'Message:', error?.message);
            console.log("❌ Détails complets monthly balances:", error);
        }
    }, [isLoggedIn, isLoading]);

    // Chargement initial AVEC écoute du changement d'authTimestamp
    useEffect(() => {
        console.log('📍 useEffect déclenché - isLoading:', isLoading, 'isLoggedIn:', isLoggedIn, 'authTimestamp:', authTimestamp);
        
        isMountedRef.current = true;

        const loadInitialData = () => {
            if (!isLoading && isLoggedIn) {
                console.log('🚀 Chargement initial du dashboard (authTimestamp:', authTimestamp, ')');
                
                // Délai pour s'assurer que le token est configuré
                const timer = setTimeout(() => {
                    if (isMountedRef.current) {
                        console.log('⏰ Timer déclenché, appel fetchData...');
                        fetchData();
                        fetchMonthlyBalances();
                    } else {
                        console.warn('⚠️ Composant démonté, annulation du chargement');
                    }
                }, 200);
                
                return () => {
                    console.log('🧹 Cleanup du timer');
                    clearTimeout(timer);
                };
            } else {
                console.log('⏸️ Conditions non remplies pour charger - isLoading:', isLoading, 'isLoggedIn:', isLoggedIn);
            }
        };

        const cleanup = loadInitialData();

        return () => {
            isMountedRef.current = false;
            if (cleanup) cleanup();
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

    // Afficher un loader pendant le chargement initial
    if (isLoading || !dataLoaded) {
        console.log('🔄 Affichage du loader - isLoading:', isLoading, 'dataLoaded:', dataLoaded);
        return (
            <div className="flex flex-column justify-content-center align-items-center" style={{ height: '80vh' }}>
                <i className="pi pi-spin pi-spinner" style={{ fontSize: '3rem' }}></i>
                <p className="mt-3 text-500">Chargement du dashboard...</p>
            </div>
        );
    }

    console.log('✨ Affichage du dashboard complet');
    console.log('🔍 État des données:', {
        summary,
        monthlyBalanceData: monthlyBalanceData ? 'présent' : 'null',
        categoryChartData: categoryChartData ? 'présent' : 'null',
        budgetProgressData: budgetProgressData?.length || 0,
        projectBudgets: projectBudgets?.length || 0
    });

    // Formater le mois en cours pour l'affichage
    const currentDate = new Date();
    const currentMonthYear = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const formattedMonth = currentMonthYear.charAt(0).toUpperCase() + currentMonthYear.slice(1);

    return (
        <div className="p-3">
            <div className="flex justify-content-between align-items-center">
                <h1 className="text-2xl font-bold" data-tour-id="dashboard-title">Dashboard Budget - {formattedMonth}</h1>
            </div>

            {/* Bouton pour relancer le guide */}
            <TourButton onStartTour={startTour} tooltip="Revoir le guide du Dashboard" />
            <div className="grid mt-2">
                <div className="col-12 md:col-6 lg:col-4" data-tour-id="card-balance">
                    <Card title="Solde Actuel">
                        <div className="flex flex-column gap-2 justify-content-center align-items-center" style={{ minHeight: '96px' }}>
                            <h2 className="m-0" style={{ color: summary.currentBalance >= 0 ? 'var(--green-400)' : 'var(--red-400)' }}>{formatCurrency(summary.currentBalance)}</h2>
                        </div>
                    </Card>
                </div>
                <div className="col-12 md:col-6 lg:col-4" data-tour-id="card-projected">
                    <Card title="Solde Fin de Mois (Prév.)">
                        <div className="flex flex-column gap-2">
                            <div>
                                <p className="m-0 text-sm text-500">Basé sur transactions</p>
                                <h2 className="m-0">{formatCurrency(summary.projectedBalance)}</h2>
                            </div>
                            {summary.totalBudgets > 0 && (
                                <div>
                                    <p className="m-0 text-sm text-500">Si budgets remplis</p>
                                    <h2 className="m-0" style={{ color: summary.projectedBalanceWithBudgets >= 0 ? 'var(--green-400)' : 'var(--red-400)' }}>{formatCurrency(summary.projectedBalanceWithBudgets)}</h2>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
                <div className="col-12 md:col-6 lg:col-4" data-tour-id="card-income-expense">
                    <Card title="Revenus & Dépenses (Prév.)">
                        <div className="flex flex-column gap-2">
                            <div>
                                <p className="m-0 text-sm text-500">Revenus</p>
                                <h2 className="m-0 text-green-400">{formatCurrency(summary.totalProjectedIncome)}</h2>
                            </div>
                            <div>
                                <p className="m-0 text-sm text-500">Dépenses</p>
                                <h2 className="m-0 text-red-400">{formatCurrency(summary.totalProjectedExpense)}</h2>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
            <div className="grid mt-4">
                <div className="col-12 lg:col-6" data-tour-id="chart-daily">
                    <Card>
                        <div className="flex justify-content-between align-items-center mb-3">
                            <h2 className="text-xl m-0">Solde début de mois</h2>
                        </div>
                        <div style={{ position: 'relative', height: '300px' }}>
                            {monthlyBalanceData ? (
                                <Chart type="line" data={monthlyBalanceData} options={lineChartOptions} />
                            ) : (
                                <div className="flex justify-content-center align-items-center h-full">
                                    <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
                <div className="col-12 lg:col-6" data-tour-id="chart-category">
                    <Card title="Dépenses par Catégorie" className="h-full">
                        {categoryChartData && categoryChartData.labels.length > 0 ? (
                            <div style={{ position: 'relative', height: '300px' }}>
                                <Chart type="pie" data={categoryChartData} options={pieChartOptions} />
                            </div>
                        ) : (<p className="text-center text-gray-500 mt-5">Aucune dépense catégorisée.</p>)}
                    </Card>
                </div>
            </div>
            <div className="grid mt-4">
                <div className="col-12 lg:col-4" data-tour-id="budget-tracker">
                    <Card title="Suivi des Budgets Mensuels" className="h-full">
                        <BudgetTracker data={budgetProgressData} />
                    </Card>
                </div>
                <div className="col-12 lg:col-4" data-tour-id="project-budgets">
                    <ProjectBudgetTracker budgets={projectBudgets} />
                </div>
                <div className="col-12 lg:col-4" data-tour-id="purchase-forecast">
                    <PurchaseForecast onUpdate={fetchData} />
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;