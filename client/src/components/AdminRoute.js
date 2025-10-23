import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AdminRoute = () => {
  const { isLoggedIn, user, isLoading } = useContext(AuthContext);

  // Pendant le chargement, on affiche un loader
  if (isLoading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <i className="pi pi-spin pi-spinner" style={{ fontSize: '3rem' }}></i>
      </div>
    );
  }

  // Si pas connecté, redirection vers login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Si connecté mais pas admin, redirection vers l'accueil approprié
  if (user?.role !== 'admin') {
    // Rediriger vers le dashboard approprié selon les accès
    if (user?.budgetAccess) {
      return <Navigate to="/budget/dashboard" replace />;
    }
    if (user?.tradingAccess) {
      return <Navigate to="/trading" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // L'utilisateur est admin, on affiche la route
  return <Outlet />;
};

export default AdminRoute;