import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import { Skeleton } from 'primereact/skeleton';

const ProtectedRoute = () => {
  const { isLoggedIn, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <div className="p-3" style={{ height: '100vh' }}>
        <Skeleton width="12rem" height="2rem" className="mb-4" />
        <div className="grid">
          <div className="col-12 md:col-6 lg:col-4"><Skeleton height="8rem" /></div>
          <div className="col-12 md:col-6 lg:col-4"><Skeleton height="8rem" /></div>
          <div className="col-12 md:col-6 lg:col-4"><Skeleton height="8rem" /></div>
        </div>
        <div className="grid mt-4">
          <div className="col-12 lg:col-6"><Skeleton height="20rem" /></div>
          <div className="col-12 lg:col-6"><Skeleton height="20rem" /></div>
        </div>
      </div>
    );
  }

  // 2. Si on a fini de vérifier ET que l'utilisateur est connecté, on affiche la page
  //    Sinon, on le redirige vers la page de connexion
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;