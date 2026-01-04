import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Logique d'authentification
import AdminRoute from './components/AdminRoute';
import BudgetRoute from './components/BudgetRoute';
import TradingRoute from './components/TradingRoute';

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
import SavingsPage from './pages/SavingsPage';
import SavingsGoalsPage from './pages/SavingsGoalsPage';
import AnalysisPage from './pages/AnalysisPage';
import BudgetAnalysisPage from './pages/BudgetAnalysisPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';

// Pages de la section Trading
import TradingDashboardPage from './pages/trading/TradingDashboardPage';
import PortfolioListPage from './pages/trading/PortfolioListPage';
import PortfolioDetailPage from './pages/trading/PortfolioDetailPage';
import ExchangesPage from './pages/trading/ExchangesPage';
import StrategyListPage from './pages/trading/StrategyListPage';
import StrategyEditPage from './pages/trading/StrategyEditPage';
import BacktestsPage from './pages/trading/BacktestsPage';
import BacktestNewPage from './pages/trading/BacktestNewPage';
import BacktestDetailPage from './pages/trading/BacktestDetailPage';
import BotActivityPage from './pages/trading/BotActivityPage';
import BotsPage from './pages/trading/BotsPage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* ROUTES PUBLIQUES */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* --- SECTION BUDGET PROTÉGÉE --- */}
                <Route path="/budget" element={<BudgetRoute />}>
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
                        <Route path="profile" element={<ProfilePage />} />
                        <Route element={<AdminRoute />}><Route path="admin" element={<AdminPage />} /></Route>
                    </Route>
                </Route>

                {/* --- SECTION TRADING PROTÉGÉE --- */}
                <Route path="/trading" element={<TradingRoute />}>
                    <Route element={<TradingLayout />}>
                        <Route index element={<TradingDashboardPage />} />
                        <Route path="portfolios" element={<PortfolioListPage />} />
                        <Route path="portfolios/new" element={<PortfolioDetailPage />} />
                        <Route path="portfolios/:id" element={<PortfolioDetailPage />} />
                        <Route path="exchanges" element={<ExchangesPage />} />
                        <Route path="strategies" element={<StrategyListPage />} />
                        <Route path="strategies/new" element={<StrategyEditPage />} />
                        <Route path="strategies/:id" element={<StrategyEditPage />} />
                        <Route path="backtests" element={<BacktestsPage />} />
                        <Route path="backtests/new" element={<BacktestNewPage />} />
                        <Route path="backtests/:id" element={<BacktestDetailPage />} />
                        <Route path="bot-activity" element={<BotActivityPage />} />
                        <Route path="profile" element={<ProfilePage />} />
                        <Route element={<AdminRoute />}><Route path="admin" element={<AdminPage />} /></Route>
                    </Route>
                </Route>
                <Route path="/bots" element={<TradingRoute />}>
                    <Route element={<TradingLayout />}>
                        <Route index element={<BotsPage />} />
                    </Route>
                </Route>
                {/* Si une URL ne correspond à rien, on renvoie vers l'accueil */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;