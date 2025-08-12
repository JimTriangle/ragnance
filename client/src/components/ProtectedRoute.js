import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const { isLoggedIn } = useContext(AuthContext);

  // Si l'utilisateur est connecté, on affiche la page demandée (via <Outlet />)
  // Sinon, on le redirige vers la page de connexion
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;