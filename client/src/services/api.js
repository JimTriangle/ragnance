import axios from 'axios';

// Si la variable d'environnement existe, on l'utilise, sinon on prend l'URL locale.
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: baseURL
});

// ... (le reste du fichier interceptor est inchangé)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;