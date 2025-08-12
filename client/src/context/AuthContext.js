import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // On installe ce package juste après

// 1. Création du Contexte
export const AuthContext = createContext();

// 2. Création du "Fournisseur" de contexte
export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Au chargement de l'app, on vérifie si un token existe dans le localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      authenticateUser(storedToken);
    }
  }, []);

  const storeToken = (receivedToken) => {
    localStorage.setItem('authToken', receivedToken);
    authenticateUser(receivedToken);
  };

  const authenticateUser = (tokenToAuth) => {
    setToken(tokenToAuth);
    setIsLoggedIn(true);
    // On décode le token pour avoir les infos de l'utilisateur (id, email, role)
    const decodedUser = jwtDecode(tokenToAuth);
    setUser(decodedUser);
  };

  const logoutUser = () => {
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, token, storeToken, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};