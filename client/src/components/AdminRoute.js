import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import { ProgressSpinner } from 'primereact/progressspinner';

const AdminRoute = () => {
  // On récupère les trois états nécessaires depuis le contexte
  const { isLoggedIn, user, isLoading } = useContext(AuthContext);

  // 1. Tant que le contexte vérifie l'authentification, on affiche un chargement
  if (isLoading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <ProgressSpinner />
      </div>
    );
  }
  
  // 2. Une fois le chargement terminé, on vérifie si l'utilisateur est bien
  //    connecté ET si son rôle est 'admin'.
  //    L'opérateur '?.' (optional chaining) est une sécurité pour éviter une erreur si l'objet 'user' est null.
  return isLoggedIn && user?.role === 'admin' ? <Outlet /> : <Navigate to="/" />;
};

export default AdminRoute;