import React, { useContext, useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Button } from 'primereact/button';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import TransactionForm from '../components/TransactionForm';
import AnnouncementBadge from '../components/AnnouncementBadge';
import AnnouncementDialog from '../components/AnnouncementDialog';
import AppSidebar from '../components/AppSidebar';
import { TransactionRefreshContext } from '../context/TransactionRefreshContext';

// Le Header minimaliste avec bouton hamburger
const TopBar = ({ onOpenSidebar, onAddTransaction, onShowAnnouncements }) => {
    return (
        <div className="top-bar flex justify-content-between align-items-center p-3" style={{ background: '#242931', borderBottom: '1px solid #495057' }}>
            <div className="flex align-items-center gap-2">
                <Button
                    icon="pi pi-bars"
                    className="p-button-text p-button-lg"
                    onClick={onOpenSidebar}
                    aria-label="Ouvrir le menu"
                />
                <h2 className="m-0 text-primary">Budget</h2>
            </div>
            <div className="flex align-items-center gap-2">
                <AnnouncementBadge onClick={onShowAnnouncements} />
                <Button
                    label="Ajouter une transaction"
                    icon="pi pi-plus"
                    className="add-transaction-button p-button-sm p-button-primary"
                    onClick={onAddTransaction}
                />
            </div>
        </div>
    );
};

// Le Layout qui assemble le Sidebar et le contenu de la page
const BudgetLayout = () => {
    const { user } = useContext(AuthContext);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const { notifyTransactionRefresh } = useContext(TransactionRefreshContext);

    const openModal = () => setIsModalVisible(true);
    const closeModal = () => setIsModalVisible(false);

    const openAnnouncements = () => setIsAnnouncementVisible(true);
    const closeAnnouncements = () => setIsAnnouncementVisible(false);

    const openSidebar = () => setIsSidebarVisible(true);
    const closeSidebar = () => setIsSidebarVisible(false);

    const handleComplete = () => {
        closeModal();
        notifyTransactionRefresh();
    };

    // Définition des liens de navigation pour la section Budget
    const budgetNavItems = [
        { to: '/budget/dashboard', label: 'Dashboard', icon: 'pi pi-home' },
        { to: '/budget/monthly', label: 'Vue Mensuelle', icon: 'pi pi-calendar' },
        { to: '/budget/categories', label: 'Catégories', icon: 'pi pi-tags' },
        { to: '/budget/budgets', label: 'Budgets Mensuels', icon: 'pi pi-wallet' },
        { to: '/budget/project-budgets', label: 'Budgets Projet', icon: 'pi pi-briefcase' },
        { to: '/budget/savings', label: 'Épargne', icon: 'pi pi-money-bill' },
        { to: '/budget/analysis', label: 'Dépenses', icon: 'pi pi-chart-bar' },
        { to: '/budget/budget-analysis', label: 'Analyse Budgets', icon: 'pi pi-chart-line' },
    ];

    // Ajouter le lien Admin si l'utilisateur est admin
    if (user?.role === 'admin') {
        budgetNavItems.push({
            to: '/budget/admin',
            label: 'Admin',
            icon: 'pi pi-cog',
            danger: true
        });
    }

    // Actions additionnelles pour le sidebar
    const sidebarActions = (
        <>
            <Button
                label="Ajouter une transaction"
                icon="pi pi-plus"
                className="w-full p-button-primary"
                onClick={() => {
                    openModal();
                    closeSidebar();
                }}
            />
        </>
    );

    // Afficher automatiquement les annonces non lues au chargement
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsAnnouncementVisible(true);
        }, 2000); // 2 secondes après le chargement
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const handleKeydown = (e) => {
            if (e.key?.toLowerCase() === 'n' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
                e.preventDefault();
                openModal();
            }
        };
        window.addEventListener('keydown', handleKeydown);
        return () => window.removeEventListener('keydown', handleKeydown);
    }, []);

    return (
        <div>
            <TopBar
                onOpenSidebar={openSidebar}
                onAddTransaction={openModal}
                onShowAnnouncements={openAnnouncements}
            />
            <AppSidebar
                visible={isSidebarVisible}
                onHide={closeSidebar}
                navItems={budgetNavItems}
                section="budget"
                additionalActions={sidebarActions}
            />
            <main>
                <ConfirmDialog />
                <Outlet /> {/* C'est ici que vos pages (Dashboard, MonthlyView...) s'afficheront */}
            </main>
            <Button icon="pi pi-plus" className="fab-button p-button-rounded p-button-primary" onClick={openModal} />
            <Dialog header="Ajouter une Transaction" visible={isModalVisible} style={{ width: '90vw', maxWidth: '500px' }} onHide={closeModal}>
                <TransactionForm onComplete={handleComplete} />
            </Dialog>
            <AnnouncementDialog visible={isAnnouncementVisible} onHide={closeAnnouncements} />
        </div>
    );
};

export default BudgetLayout;