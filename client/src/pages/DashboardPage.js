import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import useTransactionRefresh from '../hooks/useTransactionRefresh';

// Imports PrimeReact
import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';
import { SelectButton } from 'primereact/selectbutton';

// Composants
import PurchaseForecast from '../components/PurchaseForecast';
import BudgetTracker from '../components/BudgetTracker';
import ProjectBudgetTracker from '../components/ProjectBudgetTracker';

const DashboardPage = () => {
    // États du Dashboard
    const [summary, setSummary] = useState({ currentBalance: 0, projectedBalance: 0, totalProjectedIncome: 0, totalProjectedExpense: 0 });
    const [lineChartData, setLineChartData] = useState(null);
    const [categoryChartData, setCategoryChartData] = useState(null);
    const [budgetProgressData, setBudgetProgressData] = useState([]);
    const [projectBudgets, setProjectBudgets] = useState([]);
    const [chartPeriod, setChartPeriod] = useState('30d');
    const [dataLoaded, setDataLoaded] = useState(false);
    
    const { showToast } = useContext(ToastContext);
    const { isLoggedIn, isLoading, authTimestamp } = useContext(AuthContext);
    const retryTimeoutRef = useRef(null);
    const retryAttemptsRef = useRef(0);
    const isMountedRef = useRef(true);

    // Options des graphiques
    const periodOptions = [{ label: '7j', value: '7d' }, { label: '1m', value: '30d' }, { label: '3m', value: '90d' }];
    const lineChartOptions = { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#CCC' }, grid: { color: 'rgba(255,255,255,0.1)' } }, y: { ticks: { color: '#CCC' }, grid: { color: 'rgba(255,255,255,0.1)' } } } };
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

            if (!isMountedRef.current) return false;

            const encounteredErrors = [];

            if (summaryResult.status === 'fulfilled') {
                setSummary(summaryResult.value.data);
            } else {
                console.error('Impossible de charger le résumé du dashboard budget :', summaryResult.reason);
                encounteredErrors.push('le résumé global');
            }

            if (categoryStatsResult.status === 'fulfilled') {
                const categories = Array.isArray(categoryStatsResult.value.data) ? categoryStatsResult.value.data : [];
                if (categories.length > 0) {
                    setCategoryChartData({
                        labels: categories.map(c => c.categoryName),
                        datasets: [{ data: categories.map(c => c.total), backgroundColor: categories.map(c => c.categoryColor) }]
                    });
                } else {
                    setCategoryChartData(null);
                }
            } else {
                console.error('Impossible de charger les statistiques par catégorie :', categoryStatsResult.reason);
                encounteredErrors.push('les statistiques par catégorie');
            }

            if (budgetProgressResult.status === 'fulfilled') {
                setBudgetProgressData(budgetProgressResult.value.data);
            } else {
                console.error('Impossible de charger le suivi des budgets :', budgetProgressResult.reason);
                encounteredErrors.push('le suivi des budgets');
            }

            if (projectBudgetsResult.status === 'fulfilled') {
                setProjectBudgets(projectBudgetsResult.value.data);
            } else {
                console.error('Impossible de charger les budgets projets :', projectBudgetsResult.reason);
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

    const fetchLineChartData = useCallback(async (period) => {
        if (!isLoggedIn || isLoading) {
            return;
        }

        let startDate, endDate = new Date();
        const today = new Date();
        switch (period) {
            case '7d': startDate = new Date(new Date().setDate(today.getDate() - 7)); break;
            case '90d': startDate = new Date(new Date().setMonth(today.getMonth() - 3)); break;
            case '30d': default: startDate = new Date(new Date().setDate(today.getDate() - 30)); break;
        }
        try {
            const response = await api.get(`/transactions/stats/expenses-by-day?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
            if (isMountedRef.current) {
                setLineChartData({
                    labels: response.data.map(item => new Date(item.day).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })),
                    datasets: [{ label: 'Dépenses Journalières', data: response.data.map(item => item.total), fill: true, backgroundColor: 'rgba(46, 204, 113, 0.2)', borderColor: '#2ECC71', tension: 0.4 }]
                });
            }
        } catch (error) { 
            console.error("Erreur fetch line chart data", error); 
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
                        fetchLineChartData(chartPeriod);
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
    }, [isLoggedIn, isLoading, authTimestamp, fetchData, fetchLineChartData, chartPeriod]); // AJOUT : authTimestamp dans les dépendances

    // Chargement du graphique quand la période change
    useEffect(() => {
        if (!isLoading && isLoggedIn && dataLoaded) {
            fetchLineChartData(chartPeriod);
        }
    }, [chartPeriod, fetchLineChartData, isLoading, isLoggedIn, dataLoaded]);

    const refreshAfterTransaction = useCallback(async () => {
        if (isLoading || !isLoggedIn) {
            return;
        }
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }

        const success = await fetchData();
        await fetchLineChartData(chartPeriod);

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
    }, [fetchData, fetchLineChartData, chartPeriod, isLoading, isLoggedIn]);

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

    return (
        <div className="p-3">
            <div className="flex justify-content-between align-items-center">
                <h1 className="text-2xl font-bold">Dashboard Budget</h1>
            </div>
            <div className="grid mt-2">
                <div className="col-12 md:col-6 lg:col-3"><Card title="Solde Actuel"><h2 className="m-0" style={{ color: summary.currentBalance >= 0 ? 'var(--green-400)' : 'var(--red-400)' }}>{formatCurrency(summary.currentBalance)}</h2></Card></div>
                <div className="col-12 md:col-6 lg:col-3"><Card title="Solde Fin de Mois (Prév.)"><h2 className="m-0">{formatCurrency(summary.projectedBalance)}</h2></Card></div>
                <div className="col-12 md:col-6 lg:col-3"><Card title="Revenus du Mois (Prév.)"><h2 className="m-0 text-green-400">{formatCurrency(summary.totalProjectedIncome)}</h2></Card></div>
                <div className="col-12 md:col-6 lg:col-3"><Card title="Dépenses du Mois (Prév.)"><h2 className="m-0 text-red-400">{formatCurrency(summary.totalProjectedExpense)}</h2></Card></div>
            </div>
            <div className="grid mt-4">
                <div className="col-12 lg:col-6">
                    <Card>
                        <div className="flex justify-content-between align-items-center mb-3">
                            <h2 className="text-xl m-0">Dépenses journalières</h2>
                            <SelectButton value={chartPeriod} options={periodOptions} onChange={(e) => setChartPeriod(e.value)} unselectable={false} />
                        </div>
                        <div style={{ position: 'relative', height: '300px' }}>
                            {lineChartData ? (
                                <Chart type="line" data={lineChartData} options={lineChartOptions} />
                            ) : (
                                <div className="flex justify-content-center align-items-center h-full">
                                    <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
                <div className="col-12 lg:col-6">
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
                <div className="col-12 lg:col-4">
                    <Card title="Suivi des Budgets Mensuels" className="h-full">
                        <BudgetTracker data={budgetProgressData} />
                    </Card>
                </div>
                <div className="col-12 lg:col-4">
                    <ProjectBudgetTracker budgets={projectBudgets} />
                </div>
                <div className="col-12 lg:col-4">
                    <PurchaseForecast onUpdate={fetchData} />
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;