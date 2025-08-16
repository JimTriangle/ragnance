import React, { useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Button } from 'primereact/button';
import { ConfirmDialog } from 'primereact/confirmdialog';
import ThemeToggle from '../components/ThemeToggle';

// Un exemple de Header pour la section Trading (à développer plus tard)
const TradingHeader = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    return (
        <div className="main-header flex justify-content-between align-items-center p-3" style={{ background: '#1a1d24', borderBottom: '1px solid #495057' }}>
            <div className="flex align-items-center flex-wrap">
                <NavLink to="/trading" end className="p-button p-button-text main-nav-link">Dashboard</NavLink>
                <NavLink to="/trading/portfolios" className="p-button p-button-text main-nav-link">Portefeuilles</NavLink>
                <NavLink to="/trading/exchanges" className="p-button p-button-text main-nav-link">Clés API (Exchanges)</NavLink>
                <NavLink to="/trading/strategies" className="p-button p-button-text main-nav-link">Stratégies</NavLink>
                <NavLink to="/trading/backtests" className="p-button p-button-text main-nav-link">Backtests</NavLink>
                <NavLink to="/trading/bot-activity" className="p-button p-button-text main-nav-link">Bot</NavLink>
                {user?.role === 'admin' && <NavLink to="/trading/admin" className="p-button p-button-text p-button-danger ml-2 main-nav-link">Admin</NavLink>}
            </div>
            <div className="flex align-items-center">
                {user?.budgetAccess && (
                    <Button label="Budget" className="p-button-sm p-button-secondary mr-2" onClick={() => navigate('/budget/dashboard')} />
                )}
                <ThemeToggle />
                <UserInfo />
            </div>
        </div>
    );
};

const UserInfo = () => {
    const { user, logoutUser } = useContext(AuthContext);
    return (
        <>
            <NavLink to="/trading/profile" className="p-button p-button-text main-nav-link">
                <span className="mr-3">Bonjour, <strong>{user.email}</strong> !</span>
            </NavLink>
            <Button label="Déconnexion" icon="pi pi-sign-out" className="p-button-sm p-button-text" onClick={logoutUser} />
        </>
    );
};

const TradingLayout = () => {
    return (
        <div>
            <TradingHeader />
            <main>
                <ConfirmDialog />
                <Outlet />
            </main>
        </div>
    );
};

export default TradingLayout;