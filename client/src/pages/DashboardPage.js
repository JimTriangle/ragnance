import React, { useContext, useState, useEffect, useCallback } from 'react';
import { ToastContext } from '../context/ToastContext';
import api from '../services/api';

// Imports PrimeReact
import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';
import { SelectButton } from 'primereact/selectbutton';

// Composants
import ShoppingList from '../components/ShoppingList';
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
    const { showToast } = useContext(ToastContext);

    // Options des graphiques
    const periodOptions = [{ label: '7j', value: '7d' }, { label: '1m', value: '30d' }, { label: '3m', value: '90d' }];
    const lineChartOptions = { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#CCC' }, grid: { color: 'rgba(255,255,255,0.1)' } }, y: { ticks: { color: '#CCC' }, grid: { color: 'rgba(255,255,255,0.1)' } } } };
    const pieChartOptions = {
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#CCC' } } }
    };

    // Logique de récupération des données
    const fetchData = useCallback(async () => {
        try {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;
            const [summaryResponse, categoryStatsResponse, budgetProgressResponse, projectBudgetsResponse] = await Promise.all([
                api.get('/transactions/summary'),
                api.get('/transactions/stats/expenses-by-category'),
                api.get(`/budgets/progress/${year}/${month}`),
                api.get('/project-budgets')
            ]);
            setSummary(summaryResponse.data);
            setCategoryChartData({
                labels: categoryStatsResponse.data.map(c => c.categoryName),
                datasets: [{ data: categoryStatsResponse.data.map(c => c.total), backgroundColor: categoryStatsResponse.data.map(c => c.categoryColor) }]
            });
            setBudgetProgressData(budgetProgressResponse.data);
            setProjectBudgets(projectBudgetsResponse.data);
        } catch (error) {
            showToast('error', 'Erreur Critique', 'Le rechargement des données a échoué.');
        }
    }, [showToast]);

    const fetchLineChartData = useCallback(async (period) => {
        let startDate, endDate = new Date();
        const today = new Date();
        switch (period) {
            case '7d': startDate = new Date(new Date().setDate(today.getDate() - 7)); break;
            case '90d': startDate = new Date(new Date().setMonth(today.getMonth() - 3)); break;
            case '30d': default: startDate = new Date(new Date().setDate(today.getDate() - 30)); break;
        }
        try {
            const response = await api.get(`/transactions/stats/expenses-by-day?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
            setLineChartData({
                labels: response.data.map(item => new Date(item.day).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })),
                datasets: [{ label: 'Dépenses Journalières', data: response.data.map(item => item.total), fill: true, backgroundColor: 'rgba(46, 204, 113, 0.2)', borderColor: '#2ECC71', tension: 0.4 }]
            });
        } catch (error) { console.error("Erreur fetch line chart data", error); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { fetchLineChartData(chartPeriod); }, [chartPeriod, fetchLineChartData]);

    const formatCurrency = (value) => (value || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

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
                            <Chart type="line" data={lineChartData} options={lineChartOptions} />
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
                    <ShoppingList onUpdate={fetchData} />
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;