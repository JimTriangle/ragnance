import React, { useContext, useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Button } from 'primereact/button';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import ThemeToggle from '../components/ThemeToggle';
import TransactionForm from '../components/TransactionForm';

// Le Header spécifique à la section Budget, avec TOUS ses liens
const BudgetHeader = ({ onAddTransaction }) => {
    const { user } = useContext(AuthContext);
    return (
        <div className="main-header flex justify-content-between align-items-center p-3" style={{ background: '#242931', borderBottom: '1px solid #495057' }}>
            <div className="flex align-items-center flex-wrap">
                <NavLink to="/budget/dashboard" className="p-button p-button-text main-nav-link">Dashboard</NavLink>
                <NavLink to="/budget/monthly" className="p-button p-button-text main-nav-link">Vue Mensuelle</NavLink>
                <NavLink to="/budget/categories" className="p-button p-button-text main-nav-link">Catégories</NavLink>
                <NavLink to="/budget/budgets" className="p-button p-button-text main-nav-link">Budgets Mensuels</NavLink>
                <NavLink to="/budget/project-budgets" className="p-button p-button-text main-nav-link">Budgets Projet</NavLink>
                <NavLink to="/budget/analysis" className="p-button p-button-text main-nav-link">Dépenses</NavLink>
                <NavLink to="/budget/budget-analysis" className="p-button p-button-text main-nav-link">Analyse Budgets</NavLink>
                {user?.role === 'admin' && <NavLink to="/budget/admin" className="p-button p-button-text p-button-danger ml-2 main-nav-link">Admin</NavLink>}
            </div>
            <div className="flex align-items-center gap-2">
                <Button label=" Ajouter une transaction" icon="pi pi-plus" className="add-transaction-button p-button-sm p-button-primary" onClick={onAddTransaction} />
                <ThemeToggle />
                <UserInfo />
            </div>
        </div>
    );
};

// Le composant UserInfo qui est aussi spécifique à cette section
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

// Le Layout qui assemble le Header et le contenu de la page
const BudgetLayout = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);

    const openModal = () => setIsModalVisible(true);
    const closeModal = () => setIsModalVisible(false);

    const handleComplete = () => {
        closeModal();
        window.dispatchEvent(new Event('transactionAdded'));
    };

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
            <BudgetHeader onAddTransaction={openModal} />
            <main>
                <ConfirmDialog />
                <Outlet /> {/* C'est ici que vos pages (Dashboard, MonthlyView...) s'afficheront */}
            </main>
            <Button icon="pi pi-plus" className="fab-button p-button-rounded p-button-primary" onClick={openModal} />
            <Dialog header="Ajouter une Transaction" visible={isModalVisible} style={{ width: '90vw', maxWidth: '500px' }} onHide={closeModal}>
                <TransactionForm onComplete={handleComplete} />
            </Dialog>
        </div>
    );
};

export default BudgetLayout;