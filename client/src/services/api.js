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

  return '/api';;
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

let currentAuthToken = null;

const readTokenFromStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage?.getItem('authToken') || null;
  } catch (error) {
    console.warn('Impossible de lire le token dans le stockage local :', error);
    return null;
  }
};

export const setAuthToken = (token) => {
  currentAuthToken = token || null;
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

if (typeof window !== 'undefined') {
  const existingToken = readTokenFromStorage();
  if (existingToken) {
    setAuthToken(existingToken);
  }
}

api.interceptors.request.use(
  (config) => {
    if (config.url) {
      config.url = ensureRelativeUrl(config.url);
    }

    if (!config.headers) {
      config.headers = {};
    }

    if (!config.headers.Authorization) {
      const token = currentAuthToken || readTokenFromStorage();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage?.removeItem('authToken');
        }
      } catch (storageError) {
        console.warn('Impossible de nettoyer le token du stockage local :', storageError);
      }

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
