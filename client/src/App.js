import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Logique d'authentification
import AdminRoute from './components/AdminRoute';
import BudgetRoute from './components/BudgetRoute';

// Mises en page (Layouts)
import BudgetLayout from './layouts/BudgetLayout';

// Pages publiques
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';

// Pages de la section Budget
import DashboardPage from './pages/DashboardPage';
import MonthlyViewPage from './pages/MonthlyViewPage';
import CategoriesPage from './pages/CategoriesPage';
import BudgetsPage from './pages/BudgetsPage';
import ProjectBudgetsPage from './pages/ProjectBudgetsPage';
import SavingsPage from './pages/SavingsPage';
import SavingsGoalsPage from './pages/SavingsGoalsPage';
import AnalysisPage from './pages/AnalysisPage';
import BudgetAnalysisPage from './pages/BudgetAnalysisPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import ExpenseCalculatorPage from './pages/ExpenseCalculatorPage';


function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* ROUTES PUBLIQUES */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

                {/* --- SECTION BUDGET PROTÉGÉE --- */}
                <Route path="/budget" element={<BudgetRoute />}>
                    <Route index element={<Navigate to="/budget/dashboard" />} />
                    <Route element={<BudgetLayout />}>
                        <Route path="dashboard" element={<DashboardPage />} />
                        <Route path="monthly" element={<MonthlyViewPage />} />
                        <Route path="categories" element={<CategoriesPage />} />
                        <Route path="budgets" element={<BudgetsPage />} />
                        <Route path="project-budgets" element={<ProjectBudgetsPage />} />
                        <Route path="savings" element={<SavingsPage />} />
                        <Route path="savings-goals" element={<SavingsGoalsPage />} />
                        <Route path="analysis" element={<AnalysisPage />} />
                        <Route path="budget-analysis" element={<BudgetAnalysisPage />} />
                        <Route path="calculator" element={<ExpenseCalculatorPage />} />
                        <Route path="profile" element={<ProfilePage />} />
                        <Route element={<AdminRoute />}><Route path="admin" element={<AdminPage />} /></Route>
                    </Route>
                </Route>


                {/* Si une URL ne correspond à rien, on renvoie vers l'accueil */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;