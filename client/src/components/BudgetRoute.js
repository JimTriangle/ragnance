import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import { ProgressSpinner } from 'primereact/progressspinner';

const BudgetRoute = () => {
  const { isLoggedIn, user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return isLoggedIn && user?.budgetAccess ? <Outlet /> : <Navigate to="/" />;
};

export default BudgetRoute;