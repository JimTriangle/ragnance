import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api, { setAuthToken } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const logoutUser = useCallback(() => {
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
    setUser(null);
    setToken(null);
    setAuthToken(null);

  }, []);

  const authenticateUser = useCallback((tokenToAuth) => {
    setToken(tokenToAuth);
    setIsLoggedIn(true);
    setAuthToken(tokenToAuth);
    try {
      const decodedUser = jwtDecode(tokenToAuth);
      setUser(decodedUser);
    } catch (error) {
      console.error("Token invalide, déconnexion.", error);
      logoutUser();
    }
  }, [logoutUser]);

  // AJOUT : La fonction storeToken manquante, essentielle pour la connexion
  const storeToken = useCallback((receivedToken) => {
    localStorage.setItem('authToken', receivedToken);
    authenticateUser(receivedToken);
  }, [authenticateUser]);

  useEffect(() => {
    const verifyStoredToken = async () => {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        try {
          setAuthToken(storedToken);
          await api.get('/auth/verify', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });

          authenticateUser(storedToken);
        } catch (error) {
          logoutUser();
        }
      }
      setIsLoading(false);
    };
    verifyStoredToken();
  }, [authenticateUser, logoutUser]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, token, isLoading, storeToken, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};