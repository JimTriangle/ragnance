import axios from "axios";

const normalizeBaseUrl = (url) => url.replace(/\/+$/, '');
const isAbsoluteUrl = (url) => /^https?:\/\//i.test(url);

const getEnvApiUrl = () => {
  const candidates = [
    process.env.REACT_APP_API_URL,
    process.env.REACT_APP_API_BASE_URL,
    process.env.REACT_APP_BACKEND_URL
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'string') {
      return normalizeBaseUrl(candidate);
    }
  }

  return null;
};

const resolveProductionUrl = () => {
  const envUrl = getEnvApiUrl();
  if (envUrl) {
    if (isAbsoluteUrl(envUrl) || envUrl.startsWith('/')) {
      return envUrl;
    }

    if (typeof window !== 'undefined' && window.location?.origin) {
      try {
        const resolved = new URL(envUrl, window.location.origin);
        return resolved.toString();
      } catch (error) {
        console.warn('URL API invalide dans la configuration, utilisation de la valeur par défaut /api :', error);
      }
    }
  }

  if (typeof window !== 'undefined') {
    if (window.__RAGNANCE_API_BASE__) {
      return normalizeBaseUrl(window.__RAGNANCE_API_BASE__);
    }

    if (window.location?.origin) {
      return `${normalizeBaseUrl(window.location.origin)}/api`;
    }
    return '/api';
  }

  return '/api';
};

const baseURL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:5000/api'
  : resolveProductionUrl();

const ensureRelativeUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return url;
  }

  if (isAbsoluteUrl(url)) {
    return url;
  }

  return url.replace(/^\/+/, '');
};

const api = axios.create({
  baseURL: normalizeBaseUrl(baseURL),
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// IMPORTANT : Variable pour stocker le token actuel
let currentAuthToken = null;

// --- Helpers cookie pour le fallback mobile ---
const TOKEN_COOKIE_NAME = 'authToken';

const setTokenCookie = (token, maxAgeDays) => {
  if (typeof document === 'undefined') return;
  try {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    const maxAge = maxAgeDays ? `; Max-Age=${maxAgeDays * 86400}` : '';
    document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/${maxAge}; SameSite=Lax${secure}`;
  } catch (e) {
    // Ignorer silencieusement
  }
};

const getTokenCookie = () => {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_COOKIE_NAME}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  } catch (e) {
    return null;
  }
};

const removeTokenCookie = () => {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `${TOKEN_COOKIE_NAME}=; Path=/; Max-Age=0`;
  } catch (e) {
    // Ignorer silencieusement
  }
};

const readTokenFromStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const token = window.localStorage?.getItem('authToken') || null;
    if (token) return token;
  } catch (error) {
    console.warn('Impossible de lire le token dans le stockage local :', error);
  }

  // Fallback : lire depuis le cookie (utile sur mobile quand localStorage est purgé)
  return getTokenCookie();
};

// FONCTION CRITIQUE : Configuration du token
export const setAuthToken = (token) => {
  currentAuthToken = token || null;

  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export { setTokenCookie, removeTokenCookie };

// Initialisation au chargement si un token existe
if (typeof window !== 'undefined') {
  const existingToken = readTokenFromStorage();
  if (existingToken) {
    setAuthToken(existingToken);
  }
}

// Intercepteur de requête
api.interceptors.request.use(
  (config) => {
    if (config.url) {
      config.url = ensureRelativeUrl(config.url);
    }

    if (!config.headers) {
      config.headers = {};
    }

    // CRITIQUE : Toujours s'assurer que le token est présent
    if (!config.headers['Authorization']) {
      const token = currentAuthToken || readTokenFromStorage();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur de réponse
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Mode maintenance : le serveur renvoie 503 pendant les déploiements
    if (error?.response?.status === 503 && error.response.data?.maintenance) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('app:maintenance'));
      }
      return Promise.reject(error);
    }

    if (error?.response?.status === 401) {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage?.removeItem('authToken');
        }
      } catch (storageError) {
        console.warn('Impossible de nettoyer le token du stockage local :', storageError);
      }

      removeTokenCookie();
      setAuthToken(null);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:logout'));
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;