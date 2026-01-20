import React, { useContext, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Button } from 'primereact/button';
import { ConfirmDialog } from 'primereact/confirmdialog';
import AppSidebar from '../components/AppSidebar';
import Footer from '../components/Footer';

// Le Header minimaliste avec bouton hamburger
const TopBar = ({ onOpenSidebar }) => {
    return (
        <div className="top-bar flex justify-content-between align-items-center p-3" style={{ background: '#1a1d24', borderBottom: '1px solid #495057' }}>
            <div className="flex align-items-center gap-2">
                <Button
                    icon="pi pi-bars"
                    className="p-button-text p-button-lg"
                    onClick={onOpenSidebar}
                    aria-label="Ouvrir le menu"
                />
                <h2 className="m-0 text-primary">Trading</h2>
            </div>
        </div>
    );
};

const TradingLayout = () => {
    const { user } = useContext(AuthContext);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);

    const openSidebar = () => setIsSidebarVisible(true);
    const closeSidebar = () => setIsSidebarVisible(false);

    // Définition des liens de navigation pour la section Trading
    const tradingNavItems = [
        { to: '/trading', label: 'Dashboard', icon: 'pi pi-home', end: true },
        { to: '/trading/portfolios', label: 'Portefeuilles', icon: 'pi pi-briefcase' },
        { to: '/trading/exchanges', label: 'Clés API (Exchanges)', icon: 'pi pi-key' },
        { to: '/trading/strategies', label: 'Stratégies', icon: 'pi pi-sitemap' },
        { to: '/trading/backtests', label: 'Backtests', icon: 'pi pi-chart-line' },
        { to: '/trading/bot-activity', label: 'Bot', icon: 'pi pi-cog' },
    ];

    // Ajouter le lien Admin si l'utilisateur est admin
    if (user?.role === 'admin') {
        tradingNavItems.push({
            to: '/trading/admin',
            label: 'Admin',
            icon: 'pi pi-shield',
            danger: true
        });
    }

    return (
        <div>
            <TopBar onOpenSidebar={openSidebar} />
            <AppSidebar
                visible={isSidebarVisible}
                onHide={closeSidebar}
                navItems={tradingNavItems}
                section="trading"
            />
            <main>
                <ConfirmDialog />
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default TradingLayout;