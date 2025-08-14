import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

// Un exemple de Header pour la section Trading (à développer plus tard)
const TradingHeader = () => {
    return (
        <div className="main-header flex justify-content-between align-items-center p-3" style={{ background: '#1a1d24', borderBottom: '1px solid #495057' }}>
            <div className="flex align-items-center flex-wrap">
                <NavLink to="/trading" className="p-button p-button-text main-nav-link">Dashboard Trading</NavLink>
                <NavLink to="/trading/markets" className="p-button p-button-text main-nav-link">Marchés</NavLink>
                <NavLink to="/trading/strategies" className="p-button p-button-text main-nav-link">Stratégies</NavLink>
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