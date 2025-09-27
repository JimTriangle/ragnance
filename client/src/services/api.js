import axios from "axios";
const normalizeBaseUrl = (url) => url.replace(/\/+$/, '');

const resolveProductionUrl = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${normalizeBaseUrl(window.location.origin)}/api`;
  }

  return 'https://ragnance.fr/api';
};

const baseURL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:5000/api'
  : resolveProductionUrl();
const api = axios.create({
  baseURL: normalizeBaseUrl(baseURL),
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    // On récupère le token depuis le localStorage
    const token = localStorage.getItem('authToken');

    // Si le token existe, on l'ajoute dans les en-têtes (headers)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('authToken');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
