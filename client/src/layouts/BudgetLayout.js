import React, { useContext, useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Button } from 'primereact/button';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import TransactionForm from '../components/TransactionForm';
import AnnouncementBadge from '../components/AnnouncementBadge';
import AnnouncementDialog from '../components/AnnouncementDialog';
import ReminderDialog from '../components/ReminderDialog';
import AppSidebar from '../components/AppSidebar';
import { TransactionRefreshContext } from '../context/TransactionRefreshContext';
import Footer from '../components/Footer';
import api from '../services/api';

// Le Header minimaliste avec bouton hamburger
const TopBar = ({ onOpenSidebar, onAddTransaction, onShowAnnouncements, onShowReminders }) => {
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
                <Button
                    icon="pi pi-bell"
                    className="p-button-text p-button-rounded"
                    onClick={onShowReminders}
                    tooltip="Voir les rappels"
                    tooltipOptions={{ position: 'bottom' }}
                    aria-label="Voir les rappels"
                />
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
    const [isReminderVisible, setIsReminderVisible] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const { notifyTransactionRefresh } = useContext(TransactionRefreshContext);

    const openModal = () => setIsModalVisible(true);
    const closeModal = () => setIsModalVisible(false);

    const openAnnouncements = () => setIsAnnouncementVisible(true);
    const closeAnnouncements = () => setIsAnnouncementVisible(false);

    const openReminders = () => setIsReminderVisible(true);
    const closeReminders = () => setIsReminderVisible(false);

    const openSidebar = () => setIsSidebarVisible(true);
    const closeSidebar = () => setIsSidebarVisible(false);

    const handleComplete = () => {
        closeModal();
        notifyTransactionRefresh();
    };

    // Définition des liens de navigation pour la section Budget, organisés par thématique
    const budgetNavItems = [
        // Liens principaux (non groupés)
        { to: '/budget/dashboard', label: 'Dashboard', icon: 'pi pi-home' },
        { to: '/budget/monthly', label: 'Vue Mensuelle', icon: 'pi pi-calendar' },

        // Section Budgets
        {
            section: 'Budgets',
            items: [
                { to: '/budget/categories', label: 'Catégories de budgets', icon: 'pi pi-tags' },
                { to: '/budget/budgets', label: 'Budgets mensuels', icon: 'pi pi-wallet' },
                { to: '/budget/project-budgets', label: 'Budgets projets', icon: 'pi pi-briefcase' },
            ]
        },

        // Section Épargne(s)
        {
            section: 'Épargne(s)',
            items: [
                { to: '/budget/savings', label: 'Détail épargne(s)', icon: 'pi pi-money-bill' },
                { to: '/budget/savings-goals', label: 'Objectifs épargne(s)', icon: 'pi pi-flag' },
            ]
        },

        // Section Analyses
        {
            section: 'Analyses',
            items: [
                { to: '/budget/budget-analysis', label: 'Analyse budgets', icon: 'pi pi-chart-line' },
                { to: '/budget/analysis', label: 'Analyse dépenses', icon: 'pi pi-chart-bar' },
            ]
        },

        // Section Calculateur
        {
            section: 'Calculateur',
            items: [
                { to: '/budget/calculator', label: 'Répartition de charges', icon: 'pi pi-calculator' },
            ]
        },
    ];

    // Ajouter la section Administration si l'utilisateur est admin
    if (user?.role === 'admin') {
        budgetNavItems.push({
            section: 'Administration',
            items: [
                {
                    to: '/budget/admin',
                    label: 'Espace Admin',
                    icon: 'pi pi-cog',
                    danger: true
                }
            ]
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

    // Vérifier et afficher les rappels au chargement
    useEffect(() => {
        const checkReminders = async () => {
            try {
                const response = await api.get('/transactions/reminders');
                if (response.data && response.data.length > 0) {
                    setIsReminderVisible(true);
                }
            } catch (error) {
                console.error('Erreur lors de la vérification des rappels:', error);
            }
        };

        const timer = setTimeout(() => {
            checkReminders();
        }, 4000); // 4 secondes après le chargement, pour laisser les annonces s'afficher d'abord

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
                onShowReminders={openReminders}
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
            <Footer />
            <Button icon="pi pi-plus" className="fab-button p-button-rounded p-button-primary" onClick={openModal} />
            <Dialog header="Ajouter une Transaction" visible={isModalVisible} style={{ width: '50vw' }} onHide={closeModal}>
                <TransactionForm onComplete={handleComplete} />
            </Dialog>
            <AnnouncementDialog visible={isAnnouncementVisible} onHide={closeAnnouncements} />
            <ReminderDialog visible={isReminderVisible} onHide={closeReminders} />
        </div>
    );
};

export default BudgetLayout;