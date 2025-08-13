import React, { useContext, useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, Outlet } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { ToastContext } from './context/ToastContext';
import api from './services/api';

// Imports PrimeReact
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { Chart } from 'primereact/chart';
import { SelectButton } from 'primereact/selectbutton';
import { InputText } from 'primereact/inputtext';

// Pages et composants
import TransactionForm from './components/TransactionForm';
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

// CSS
import 'primereact/resources/themes/vela-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';


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
                <NavLink to="/" className="p-button p-button-text mr-2"><span>Dashboard</span></NavLink>
                <NavLink to="/monthly" className="p-button p-button-text mr-2"><span>Vue Mensuelle</span></NavLink>
                <NavLink to="/categories" className="p-button p-button-text mr-2"><span>Catégories</span></NavLink>
                <NavLink to="/budgets" className="p-button p-button-text mr-2"><span>Budgets Mensuels</span></NavLink>
                <NavLink to="/project-budgets" className="p-button p-button-text mr-2"><span>Budgets Projet</span></NavLink>
                <NavLink to="/analysis" className="p-button p-button-text"><span>Dépenses</span></NavLink>
                <NavLink to="/budget-analysis" className="p-button p-button-text"><span>Analyse Budgets</span></NavLink>
                {user?.role === 'admin' && <NavLink to="/admin" className="p-button p-button-text p-button-danger ml-2"><span>Admin</span></NavLink>}
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
            <NavLink to="/profile" className="p-button p-button-text">
                <span className="mr-3">Bonjour, <strong>{user.email}</strong> !</span>
            </NavLink>
            <Button label="Déconnexion" icon="pi pi-sign-out" className="p-button-sm p-button-text" onClick={logoutUser} />
        </>
    );
};

const DashboardPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({ currentBalance: 0, projectedBalance: 0, totalProjectedIncome: 0, totalProjectedExpense: 0 });
    const [lineChartData, setLineChartData] = useState(null);
    const [categoryChartData, setCategoryChartData] = useState(null);
    const [budgetProgressData, setBudgetProgressData] = useState([]);
    const [projectBudgets, setProjectBudgets] = useState([]);
    const [chartPeriod, setChartPeriod] = useState('30d');
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const { showToast } = useContext(ToastContext);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [isNewTransactionModalVisible, setIsNewTransactionModalVisible] = useState(false);

    const periodOptions = [{ label: '24h', value: '24h' }, { label: '7j', value: '7d' }, { label: '1m', value: '30d' }, { label: '3m', value: '90d' }, { label: '1a', value: 'year' }];
    const lineChartOptions = { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#CCC' }, grid: { color: 'rgba(255,255,255,0.1)' } }, y: { ticks: { color: '#CCC' }, grid: { color: 'rgba(255,255,255,0.1)' } } } };
    const doughnutChartOptions = { maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#CCC', font: { size: 10 } } } } };

   const fetchData = useCallback(async () => {
        setLoading(true);
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        try {
            const [transacResponse, summaryResponse, categoryStatsResponse, budgetProgressResponse, projectBudgetsResponse] = await Promise.all([
                api.get('/transactions/dashboard-list'),
                api.get('/transactions/summary'),
                api.get('/transactions/stats/expenses-by-category'),
                api.get(`/budgets/progress/${year}/${month}`),
                api.get('/project-budgets')
            ]);

            setTransactions(transacResponse.data);
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
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const fetchLineChartData = useCallback(async (period) => {
        let startDate, endDate = new Date();
        const today = new Date();
        switch (period) {
            case '24h': startDate = new Date(new Date().setDate(today.getDate() - 1)); break;
            case '7d': startDate = new Date(new Date().setDate(today.getDate() - 7)); break;
            case '90d': startDate = new Date(new Date().setMonth(today.getMonth() - 3)); break;
            case 'year': startDate = new Date(today.getFullYear(), 0, 1); break;
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

    useEffect(() => { 
        fetchData(); 
    }, [fetchData]);

    useEffect(() => { 
        fetchLineChartData(chartPeriod); 
    }, [chartPeriod, fetchLineChartData]);

    const handleComplete = () => {
        showToast('success', 'Succès', 'Opération réussie');
        setIsEditModalVisible(false);
        setIsNewTransactionModalVisible(false);
        fetchData();
        fetchLineChartData(chartPeriod);
    };

    const handleEditClick = (transaction) => { setSelectedTransaction(transaction); setIsEditModalVisible(true); };

    const confirmDelete = (transactionId) => {
        const handleDelete = async () => {
            try {
                await api.delete(`/transactions/${transactionId}`);
                showToast('success', 'Succès', 'Transaction supprimée');
                fetchData();
                fetchLineChartData(chartPeriod);
            } catch (error) { showToast('error', 'Erreur', 'La suppression a échoué'); }
        };
        confirmDialog({ message: 'Êtes-vous sûr ?', header: 'Confirmation', icon: 'pi pi-exclamation-triangle', acceptClassName: 'p-button-danger', accept: handleDelete, });
    };

    const labelBodyTemplate = (rowData) => (<div className="flex align-items-center"> {rowData.transactionType === 'recurring' && <i className="pi pi-sync mr-2" title="Transaction récurrente"></i>} {rowData.label} </div>);
    const actionBodyTemplate = (rowData) => (<div className="flex justify-content-center gap-2"> <Button icon="pi pi-pencil" className="p-button-rounded p-button-success p-button-sm" onClick={() => handleEditClick(rowData)} /> <Button icon="pi pi-trash" className="p-button-rounded p-button-danger p-button-sm" onClick={() => confirmDelete(rowData.id)} /> </div>);
    const formatCurrency = (value) => (value || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
    const formatDate = (value) => value ? new Date(value).toLocaleDateString('fr-FR') : '-';
    const typeTemplate = (rowData) => { const severity = rowData.type === 'income' ? 'success' : 'danger'; const text = rowData.type === 'income' ? 'Revenu' : 'Dépense'; return <Tag severity={severity} value={text}></Tag>; };

    const transactionListHeader = (
        <div className="flex justify-content-between align-items-center">
            <h2 className="text-xl m-0">Transactions</h2>
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Rechercher..." className="p-inputtext-sm" />
            </span>
        </div>
    );

        return (
        <div className="p-3">
            <div className="flex justify-content-between align-items-center">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <Button label="Ajouter une transaction" icon="pi pi-plus" className="p-button-success" onClick={() => setIsNewTransactionModalVisible(true)} />
            </div>

            <div className="grid mt-2">
                <div className="col-12 md:col-6 lg:col-3"><Card title="Solde Actuel"><h2 className="m-0" style={{ color: summary.currentBalance >= 0 ? 'var(--green-400)' : 'var(--red-400)' }}>{formatCurrency(summary.currentBalance)}</h2></Card></div>
                <div className="col-12 md:col-6 lg:col-3"><Card title="Solde Fin de Mois (Prév.)"><h2 className="m-0">{formatCurrency(summary.projectedBalance)}</h2></Card></div>
                <div className="col-12 md:col-6 lg:col-3"><Card title="Revenus du Mois (Prév.)"><h2 className="m-0 text-green-400">{formatCurrency(summary.totalProjectedIncome)}</h2></Card></div>
                <div className="col-12 md:col-6 lg:col-3"><Card title="Dépenses du Mois (Prév.)"><h2 className="m-0 text-red-400">{formatCurrency(summary.totalProjectedExpense)}</h2></Card></div>
            </div>

            <div className="grid mt-4">
                {/* BLOC GRAPHIQUE RÉINTÉGRÉ */}
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
            
            <div className="card mt-4">
                <DataTable value={transactions} loading={loading} size="small" globalFilter={globalFilter} header={transactionListHeader} paginator rows={10} rowsPerPageOptions={[5, 10, 25, 50]} >
                    <Column field="label" header="Libellé" body={labelBodyTemplate} sortable />
                    <Column field="amount" header="Montant" body={(rowData) => formatCurrency(rowData.amount)} sortable/>
                    <Column field="type" header="Type" body={typeTemplate} sortable/>
                    <Column field="date" header="Date" body={(rowData) => formatDate(rowData.date)} sortable/>
                    <Column body={actionBodyTemplate} header="Actions" style={{ width: '7rem' }} />
                </DataTable>
            </div>

            <Dialog header="Ajouter une Transaction" visible={isNewTransactionModalVisible} style={{ width: '50vw' }} onHide={() => setIsNewTransactionModalVisible(false)} >
                <TransactionForm onComplete={handleComplete} />
            </Dialog>
            <Dialog header="Modifier la Transaction" visible={isEditModalVisible} style={{ width: '50vw' }} onHide={() => setIsEditModalVisible(false)} >
                <TransactionForm transactionToEdit={selectedTransaction} onComplete={handleComplete} />
            </Dialog>
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