import React, { useContext } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Button } from 'primereact/button';
import { ConfirmDialog } from 'primereact/confirmdialog';

// Le Header spécifique à la section Budget, avec TOUS ses liens
const BudgetHeader = () => {
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
            <div className="flex align-items-center">
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
    return (
        <div>
            <BudgetHeader />
            <main>
                <ConfirmDialog />
                <Outlet /> {/* C'est ici que vos pages (Dashboard, MonthlyView...) s'afficheront */}
            </main>
        </div>
    );
};

export default BudgetLayout;