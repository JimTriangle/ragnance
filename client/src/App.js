import React, { useContext, useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, Outlet } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { ToastContext } from './context/ToastContext';
import api from './services/api';

// Imports PrimeReact (liste nettoyée)
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Chart } from 'primereact/chart';
import { SelectButton } from 'primereact/selectbutton';

// Pages et composants
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import MonthlyViewPage from './pages/MonthlyViewPage';
import AdminRoute from './components/AdminRoute';
import AdminPage from './pages/AdminPage';
import ShoppingList from './components/ShoppingList';
import CategoriesPage from './pages/CategoriesPage';
import BudgetsPage from './pages/BudgetsPage';
import BudgetTracker from './components/BudgetTracker';
import AnalysisPage from './pages/AnalysisPage';
import ProfilePage from './pages/ProfilePage';
import ProjectBudgetsPage from './pages/ProjectBudgetsPage';
import ProjectBudgetTracker from './components/ProjectBudgetTracker';
import BudgetAnalysisPage from './pages/BudgetAnalysisPage';


const AppLayout = () => {
    return (
        <div>
            <Header />
            <main>
                <ConfirmDialog />
                <Outlet />
            </main>
        </div>
    );
};

const Header = () => {
    const { user } = useContext(AuthContext);
    return (
        <div className="main-header flex justify-content-between align-items-center p-3" style={{ background: '#242931', borderBottom: '1px solid #495057' }}>
            <div className="flex align-items-center flex-wrap">
                <NavLink to="/" className="p-button p-button-text main-nav-link">Dashboard</NavLink>
                <NavLink to="/monthly" className="p-button p-button-text main-nav-link">Vue Mensuelle</NavLink>
                <NavLink to="/categories" className="p-button p-button-text main-nav-link">Catégories</NavLink>
                <NavLink to="/budgets" className="p-button p-button-text main-nav-link">Budgets Mensuels</NavLink>
                <NavLink to="/project-budgets" className="p-button p-button-text main-nav-link">Budgets Projet</NavLink>
                <NavLink to="/analysis" className="p-button p-button-text main-nav-link">Dépenses</NavLink>
                <NavLink to="/budget-analysis" className="p-button p-button-text main-nav-link">Analyse Budgets</NavLink>
                {user?.role === 'admin' && <NavLink to="/admin" className="p-button p-button-text p-button-danger ml-2 main-nav-link">Admin</NavLink>}
            </div>
            <div className="flex align-items-center">
                <UserInfo />
            </div>
        </div>
    );
};

const UserInfo = () => {
    const { user, logoutUser } = useContext(AuthContext);
    return (
        <>
            <NavLink to="/profile" className="p-button p-button-text main-nav-link">
                <span className="mr-3">Bonjour, <strong>{user.email}</strong> !</span>
            </NavLink>
            <Button label="Déconnexion" icon="pi pi-sign-out" className="p-button-sm p-button-text" onClick={logoutUser} />
        </>
    );
};

const DashboardPage = () => {
    // ÉTATS NÉCESSAIRES UNIQUEMENT
    const [summary, setSummary] = useState({ currentBalance: 0, projectedBalance: 0, totalProjectedIncome: 0, totalProjectedExpense: 0 });
    const [lineChartData, setLineChartData] = useState(null);
    const [categoryChartData, setCategoryChartData] = useState(null);
    const [budgetProgressData, setBudgetProgressData] = useState([]);
    const [projectBudgets, setProjectBudgets] = useState([]);
    const [chartPeriod, setChartPeriod] = useState('30d');
    const { showToast } = useContext(ToastContext);

    // OPTIONS DES GRAPHIQUES
    const periodOptions = [{ label: '7j', value: '7d' }, { label: '1m', value: '30d' }, { label: '3m', value: '90d' }];
    const lineChartOptions = { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#CCC' }, grid: { color: 'rgba(255,255,255,0.1)' } }, y: { ticks: { color: '#CCC' }, grid: { color: 'rgba(255,255,255,0.1)' } } } };
    const doughnutChartOptions = { maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#CCC', font: { size: 10 } } } } };

    // LOGIQUE DE RÉCUPÉRATION DES DONNÉES
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
            console.error("Erreur fatale lors du chargement du dashboard :", error);
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
                <h1 className="text-2xl font-bold">Dashboard</h1>
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
                        <div style={{ height: '300px' }}>
                            <Chart type="line" data={lineChartData} options={lineChartOptions} />
                        </div>
                    </Card>
                </div>
                <div className="col-12 lg:col-3">
                    <Card title="Dépenses par Catégorie" className="h-full">
                        {categoryChartData && categoryChartData.labels.length > 0 ? (
                            <Chart type="pie" data={categoryChartData} options={doughnutChartOptions} />
                        ) : (<p className="text-center text-gray-500 mt-5">Aucune dépense catégorisée.</p>)}
                    </Card>
                </div>
                <div className="col-12 lg:col-3">
                    <ShoppingList onUpdate={fetchData} />
                </div>
            </div>
            <div className="grid mt-4">
                 <div className="col-12 lg:col-6">
                    <Card title="Suivi des Budgets Mensuels" className="h-full">
                        <BudgetTracker data={budgetProgressData} />
                    </Card>
                </div>
                <div className="col-12 lg:col-6">
                    <ProjectBudgetTracker budgets={projectBudgets} />
                </div>
            </div>
        </div>
    );
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/monthly" element={<MonthlyViewPage />} />
                        <Route path="/categories" element={<CategoriesPage />} />
                        <Route path="/budgets" element={<BudgetsPage />} />
                        <Route path="/project-budgets" element={<ProjectBudgetsPage />} />
                        <Route path="/analysis" element={<AnalysisPage />} />
                        <Route path="/budget-analysis" element={<BudgetAnalysisPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route element={<AdminRoute />}><Route path="/admin" element={<AdminPage />} /></Route>
                    </Route>
                </Route>
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;