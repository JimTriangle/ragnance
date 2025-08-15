import React, { useContext }  from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Button } from 'primereact/button';
import { ConfirmDialog } from 'primereact/confirmdialog';
// Un exemple de Header pour la section Trading (à développer plus tard)
const TradingHeader = () => {
    return (
        <div className="main-header flex justify-content-between align-items-center p-3" style={{ background: '#1a1d24', borderBottom: '1px solid #495057' }}>
            <div className="flex align-items-center flex-wrap">
                <NavLink to="/trading" end className="p-button p-button-text main-nav-link">Dashboard</NavLink>
                <NavLink to="/trading/portfolios" className="p-button p-button-text main-nav-link">Portefeuilles</NavLink>
                <NavLink to="/trading/exchanges" className="p-button p-button-text main-nav-link">Exchanges</NavLink>
                <NavLink to="/trading/strategy" className="p-button p-button-text main-nav-link">Stratégie</NavLink>
                <NavLink to="/trading/backtests" className="p-button p-button-text main-nav-link">Backtests</NavLink>
                <NavLink to="/trading/bot-activity" className="p-button p-button-text main-nav-link">Bot</NavLink>
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
            <NavLink to="/budget/profile" className="p-button p-button-text main-nav-link">
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