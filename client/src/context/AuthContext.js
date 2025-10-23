import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import api, { setAuthToken } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokenVerificationDone = useRef(false);
  const authReadyCallbacks = useRef([]);

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
      return false;
    }

    try {
      const decodedUser = jwtDecode(tokenToAuth);
      
      // Vérifier si le token est expiré
      if (decodedUser.exp && decodedUser.exp * 1000 < Date.now()) {
        console.warn("Token expiré, déconnexion.");
        logoutUser({ emitEvent: true });
        return false;
      }

      // CRITIQUE : Configuration du token AVANT tout le reste
      setAuthToken(tokenToAuth);
      api.defaults.headers.common.Authorization = `Bearer ${tokenToAuth}`;
      
      // Mise à jour des états
      setToken(tokenToAuth);
      setUser(decodedUser);
      setIsLoggedIn(true);

      // Notifier les callbacks en attente que l'auth est prête
      if (authReadyCallbacks.current.length > 0) {
        setTimeout(() => {
          authReadyCallbacks.current.forEach(callback => {
            try {
              callback();
            } catch (err) {
              console.error('Erreur dans le callback auth:', err);
            }
          });
          authReadyCallbacks.current = [];
        }, 0);
      }

      return true;
    } catch (error) {
      console.error("Token invalide, déconnexion.", error);
      logoutUser({ emitEvent: true });
      return false;
    }
  }, [logoutUser]);

  const storeToken = useCallback((receivedToken) => {
    try {
      localStorage.setItem('authToken', receivedToken);
    } catch (error) {
      console.warn('Impossible de sauvegarder le token :', error);
    }
    
    const success = authenticateUser(receivedToken);
    
    // Forcer un re-render pour que tous les composants voient le changement
    if (success) {
      // Dispatcher un événement personnalisé pour notifier tous les composants
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:login', { 
          detail: { token: receivedToken } 
        }));
      }
    }
    
    return success;
  }, [authenticateUser]);

  // Fonction pour enregistrer un callback à exécuter quand l'auth est prête
  const onAuthReady = useCallback((callback) => {
    if (isLoggedIn && !isLoading) {
      // Auth déjà prête, exécuter immédiatement
      callback();
    } else {
      // Enregistrer pour exécution future
      authReadyCallbacks.current.push(callback);
    }
  }, [isLoggedIn, isLoading]);

  useEffect(() => {
    const verifyStoredToken = async () => {
      // Éviter les doubles vérifications
      if (tokenVerificationDone.current) {
        return;
      }
      tokenVerificationDone.current = true;

      let storedToken = null;
      try {
        storedToken = localStorage.getItem('authToken');
      } catch (error) {
        console.warn('Impossible de lire le token depuis le stockage local :', error);
      }

      if (storedToken) {
        try {
          // Configurer le token AVANT la vérification API
          setAuthToken(storedToken);
          
          const response = await api.get('/auth/verify', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });

          // Si la vérification réussit, authentifier
          if (response.status === 200) {
            authenticateUser(storedToken);
          } else {
            logoutUser({ emitEvent: false });
          }
        } catch (error) {
          console.error('Erreur de vérification du token:', error);
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

  // Vérifier périodiquement si le token n'est pas expiré
  useEffect(() => {
    if (!token || !isLoggedIn) return;

    const checkTokenExpiration = () => {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          console.warn("Token expiré détecté, déconnexion.");
          logoutUser({ emitEvent: true });
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du token:", error);
      }
    };

    // Vérifier toutes les 60 secondes
    const interval = setInterval(checkTokenExpiration, 60000);
    
    return () => clearInterval(interval);
  }, [token, isLoggedIn, logoutUser]);

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      user, 
      token, 
      isLoading, 
      storeToken, 
      logoutUser,
      onAuthReady 
    }}>
      {children}
    </AuthContext.Provider>
  );
};