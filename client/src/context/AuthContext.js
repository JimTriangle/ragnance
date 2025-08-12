import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // <-- AJOUT 1 : L'état de chargement

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    
    if (storedToken) {
      authenticateUser(storedToken);
    }

    // AJOUT 2 : On a fini de vérifier, on arrête le chargement
    setIsLoading(false); 
  }, []);

  const storeToken = (receivedToken) => {
    localStorage.setItem('authToken', receivedToken);
    authenticateUser(receivedToken);
  };

  const authenticateUser = (tokenToAuth) => {
    setToken(tokenToAuth);
    setIsLoggedIn(true);
    try {
        const decodedUser = jwtDecode(tokenToAuth);
        setUser(decodedUser);
    } catch (error) {
        // En cas de token invalide, on déconnecte
        console.error("Token invalide, déconnexion.", error);
        logoutUser();
    }
  };

  const logoutUser = () => {
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
    setUser(null);
    setToken(null);
  };

  return (
    // AJOUT 3 : On donne 'isLoading' au reste de l'application
    <AuthContext.Provider value={{ isLoggedIn, user, token, isLoading, storeToken, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};