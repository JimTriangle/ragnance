import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import TransactionForm from '../components/TransactionForm';
import AnnouncementBadge from '../components/AnnouncementBadge';
import AnnouncementDialog from '../components/AnnouncementDialog';
import ReminderDialog from '../components/ReminderDialog';
import AppSidebar from '../components/AppSidebar';
import DesktopSidebar from '../components/DesktopSidebar';
import Breadcrumbs from '../components/Breadcrumbs';
import { TransactionRefreshContext } from '../context/TransactionRefreshContext';
import Footer from '../components/Footer';
import api from '../services/api';

// Le Header minimaliste avec bouton hamburger
const TopBar = ({ onOpenSidebar, onAddTransaction, onShowAnnouncements, onShowReminders }) => {
    return (
        <div className="top-bar flex justify-content-between align-items-center p-3" style={{ background: 'var(--surface-ground)', borderBottom: '1px solid var(--surface-border)' }}>
            <div className="flex align-items-center gap-2">
                <Button
                    icon="pi pi-bars"
                    className="btn-icon-modern hamburger-button"
                    onClick={onOpenSidebar}
                    aria-label="Ouvrir le menu"
                    style={{ width: '2.5rem', height: '2.5rem', fontSize: '1.1rem' }}
                />
                <h2 className="m-0 text-primary">Budget</h2>
            </div>
            <div className="flex align-items-center gap-2">
                <Button
                    icon="pi pi-bell"
                    className="btn-icon-modern"
                    onClick={onShowReminders}
                    tooltip="Voir les rappels"
                    tooltipOptions={{ position: 'bottom' }}
                    aria-label="Voir les rappels"
                />
                <AnnouncementBadge onClick={onShowAnnouncements} />
                <Button
                    label="Ajouter une transaction"
                    icon="pi pi-plus"
                    className="add-transaction-button btn-modern btn-modern--success btn-modern--sm"
                    onClick={onAddTransaction}
                    tooltip="Ajouter une transaction (N)"
                    tooltipOptions={{ position: 'bottom' }}
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
    const formDirtyRef = useRef(false);

    const openModal = () => setIsModalVisible(true);
    const closeModal = () => setIsModalVisible(false);

    const handleFormDirtyChange = useCallback((dirty) => {
        formDirtyRef.current = dirty;
    }, []);

    const handleModalHide = useCallback(() => {
        if (formDirtyRef.current) {
            confirmDialog({
                message: 'Vous avez des modifications non sauvegardées. Voulez-vous vraiment fermer ?',
                header: 'Modifications non sauvegardées',
                icon: 'pi pi-exclamation-triangle',
                acceptClassName: 'p-button-danger',
                acceptLabel: 'Fermer',
                rejectLabel: 'Continuer l\'édition',
                accept: () => {
                    formDirtyRef.current = false;
                    closeModal();
                },
            });
        } else {
            closeModal();
        }
    }, []);

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
                label="Ajouter une transaction (N)"
                icon="pi pi-plus"
                className="w-full btn-modern btn-modern--success"
                onClick={() => {
                    openModal();
                    closeSidebar();
                }}
            />
        </>
    );

    // Afficher automatiquement les annonces non lues au chargement (une seule fois par session)
    useEffect(() => {
        if (sessionStorage.getItem('announcements_shown')) return;
        const timer = setTimeout(() => {
            setIsAnnouncementVisible(true);
            sessionStorage.setItem('announcements_shown', 'true');
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    // Vérifier et afficher les rappels au chargement (une seule fois par session)
    useEffect(() => {
        if (sessionStorage.getItem('reminders_shown')) return;
        const checkReminders = async () => {
            try {
                const response = await api.get('/transactions/reminders');
                if (response.data && response.data.length > 0) {
                    setIsReminderVisible(true);
                    sessionStorage.setItem('reminders_shown', 'true');
                }
            } catch (error) {
                // silencieux en production
            }
        };

        const timer = setTimeout(() => {
            checkReminders();
        }, 4000);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const handleKeydown = (e) => {
            if (e.key?.toLowerCase() === 'n' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) && !e.target.isContentEditable) {
                e.preventDefault();
                openModal();
            }
        };
        window.addEventListener('keydown', handleKeydown);
        return () => window.removeEventListener('keydown', handleKeydown);
    }, []);

    return (
        <div className="layout-with-sidebar">
            <DesktopSidebar navItems={budgetNavItems} section="budget" />
            <TopBar
                onOpenSidebar={openSidebar}
                onAddTransaction={openModal}
                onShowAnnouncements={openAnnouncements}
                onShowReminders={openReminders}
            />
            <Breadcrumbs />
            <AppSidebar
                visible={isSidebarVisible}
                onHide={closeSidebar}
                navItems={budgetNavItems}
                section="budget"
                additionalActions={sidebarActions}
            />
            <main>
                <ConfirmDialog />
                <Outlet />
            </main>
            <Footer />
            <Dialog header="Ajouter une Transaction" visible={isModalVisible} style={{ width: '50vw' }} breakpoints={{ '960px': '75vw', '641px': '95vw' }} onHide={handleModalHide}>
                <TransactionForm onComplete={handleComplete} onDirtyChange={handleFormDirtyChange} />
            </Dialog>
            <AnnouncementDialog visible={isAnnouncementVisible} onHide={closeAnnouncements} />
            <ReminderDialog visible={isReminderVisible} onHide={closeReminders} />
        </div>
    );
};

export default BudgetLayout;