import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api, { setAuthToken } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const logoutUser = useCallback((eventOrOptions, maybeOptions) => {
    let options = {};

    if (eventOrOptions && typeof eventOrOptions.preventDefault === 'function') {
      eventOrOptions.preventDefault();
      options = typeof maybeOptions === 'object' && maybeOptions !== null ? maybeOptions : {};
    } else if (eventOrOptions && typeof eventOrOptions === 'object') {
      options = eventOrOptions;
    }

    const { emitEvent = true } = options;

    try {
      localStorage.removeItem('authToken');
    } catch (error) {
      console.warn('Impossible de supprimer le token du stockage local :', error);
    }
    delete api.defaults.headers.common.Authorization;
    setAuthToken(null);
    setIsLoggedIn(false);
    setUser(null);
    setToken(null);

    if (emitEvent && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth:logout'));
    }

  }, []);

  const authenticateUser = useCallback((tokenToAuth) => {
    if (!tokenToAuth) {
      logoutUser({ emitEvent: false });
      return;
    }
    setToken(tokenToAuth);
    setIsLoggedIn(true);
    setAuthToken(tokenToAuth);
    api.defaults.headers.common.Authorization = `Bearer ${tokenToAuth}`;

    try {
      const decodedUser = jwtDecode(tokenToAuth);
      setUser(decodedUser);
    } catch (error) {
      console.error("Token invalide, déconnexion.", error);
      logoutUser({ emitEvent: true });
    }
  }, [logoutUser]);

  // AJOUT : La fonction storeToken manquante, essentielle pour la connexion
  const storeToken = useCallback((receivedToken) => {
    try {
      localStorage.setItem('authToken', receivedToken);
    } catch (error) {
      console.warn('Impossible de sauvegarder le token :', error);
    }
    authenticateUser(receivedToken);
  }, [authenticateUser]);

  useEffect(() => {
    const verifyStoredToken = async () => {
      let storedToken = null;
      try {
        storedToken = localStorage.getItem('authToken');
      } catch (error) {
        console.warn('Impossible de lire le token depuis le stockage local :', error);
      }
      if (storedToken) {
        try {
          setAuthToken(storedToken);
          await api.get('/auth/verify', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });

          authenticateUser(storedToken);
        } catch (error) {
          logoutUser({ emitEvent: false });
        }
      }
      setIsLoading(false);
    };
    verifyStoredToken();
  }, [authenticateUser, logoutUser]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleForcedLogout = () => {
      logoutUser({ emitEvent: false });
    };

    window.addEventListener('auth:logout', handleForcedLogout);
    return () => {
      window.removeEventListener('auth:logout', handleForcedLogout);
    };
  }, [logoutUser]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, token, isLoading, storeToken, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};