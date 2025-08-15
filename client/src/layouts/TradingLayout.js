import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

// Un exemple de Header pour la section Trading (à développer plus tard)
const TradingHeader = () => {
    return (
        <div className="main-header flex justify-content-between align-items-center p-3" style={{ background: '#1a1d24', borderBottom: '1px solid #495057' }}>
            <div className="flex align-items-center flex-wrap">
                <NavLink to="/trading" end className="p-button p-button-text main-nav-link">Dashboard</NavLink>
                <NavLink to="/trading/portfolios" className="p-button p-button-text main-nav-link">Portefeuilles</NavLink>
                <NavLink to="/trading/exchanges" className="p-button p-button-text main-nav-link">Exchanges</NavLink>
                <NavLink to="/trading/strategy" className="p-button p-button-text main-nav-link">Stratégie</NavLink>
                <NavLink to="/trading/simulation" className="p-button p-button-text main-nav-link">Simulation</NavLink>
                <NavLink to="/trading/bot-activity" className="p-button p-button-text main-nav-link">Bot</NavLink>
            </div>
            <div>{/* Espace pour un futur UserInfo */}</div>
        </div>
    );
};

const TradingLayout = () => {
    return (
        <div>
            <TradingHeader />
            <main>
                <Outlet />
            </main>
        </div>
    );
};

export default TradingLayout;