import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Logique d'authentification
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Mises en page (Layouts)
import BudgetLayout from './layouts/BudgetLayout';
import TradingLayout from './layouts/TradingLayout';

// Pages publiques
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';

// Pages de la section Budget
import DashboardPage from './pages/DashboardPage';
import MonthlyViewPage from './pages/MonthlyViewPage';
import CategoriesPage from './pages/CategoriesPage';
import BudgetsPage from './pages/BudgetsPage';
import ProjectBudgetsPage from './pages/ProjectBudgetsPage';
import AnalysisPage from './pages/AnalysisPage';
import BudgetAnalysisPage from './pages/BudgetAnalysisPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';

// Pages de la section Trading
import TradingPage from './pages/TradingPage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* ROUTES PUBLIQUES */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* --- SECTION BUDGET PROTÉGÉE --- */}
                <Route path="/budget" element={<ProtectedRoute />}>
                    <Route element={<BudgetLayout />}>
                        <Route path="dashboard" element={<DashboardPage />} />
                        <Route path="monthly" element={<MonthlyViewPage />} />
                        <Route path="categories" element={<CategoriesPage />} />
                        <Route path="budgets" element={<BudgetsPage />} />
                        <Route path="project-budgets" element={<ProjectBudgetsPage />} />
                        <Route path="analysis" element={<AnalysisPage />} />
                        <Route path="budget-analysis" element={<BudgetAnalysisPage />} />
                        <Route path="profile" element={<ProfilePage />} />
                        <Route element={<AdminRoute />}><Route path="admin" element={<AdminPage />} /></Route>
                    </Route>
                </Route>

                {/* --- SECTION TRADING PROTÉGÉE --- */}
                <Route path="/trading" element={<ProtectedRoute />}>
                    <Route element={<TradingLayout />}>
                        {/* 'index' signifie que c'est la page par défaut pour /trading */}
                        <Route index element={<TradingPage />} /> 
                        {/* Ajoutez ici vos futures routes de trading, ex: <Route path="markets" element={<MarketsPage />} /> */}
                    </Route>
                </Route>
                
                {/* Si une URL ne correspond à rien, on renvoie vers l'accueil */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;