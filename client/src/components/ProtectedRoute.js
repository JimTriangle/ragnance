import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import { ProgressSpinner } from 'primereact/progressspinner'; // On importe un indicateur

const ProtectedRoute = () => {
  // On récupère les deux états
  const { isLoggedIn, isLoading } = useContext(AuthContext);

  // 1. Si on est en train de vérifier, on affiche un chargement
  if (isLoading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <ProgressSpinner />
      </div>
    );
  }

  // 2. Si on a fini de vérifier ET que l'utilisateur est connecté, on affiche la page
  //    Sinon, on le redirige vers la page de connexion
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;