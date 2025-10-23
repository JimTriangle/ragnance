import React, { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const BudgetRoute = () => {
  const { isLoggedIn, user, isLoading } = useContext(AuthContext);
  const location = useLocation();

  // Pendant le chargement, on affiche un loader
  if (isLoading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <i className="pi pi-spin pi-spinner" style={{ fontSize: '3rem' }}></i>
      </div>
    );
  }

  // Si pas connecté, on sauvegarde la destination et on redirige vers login
  if (!isLoggedIn) {
    sessionStorage.setItem('postLoginRedirect', location.pathname);
    return <Navigate to="/login" replace />;
  }

  // Si connecté mais pas d'accès budget, on redirige vers l'accueil
  if (!user?.budgetAccess) {
    return <Navigate to="/" replace />;
  }

  // Tout est OK, on affiche la route
  return <Outlet />;
};

export default BudgetRoute;