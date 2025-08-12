import axios from 'axios';

const baseURL = process.env.NODE_ENV === 'production'
  ? 'https://ragnance-node.onrender.com/api' // URL de production
  : 'http://localhost:5000/api';               // URL de développement local

const api = axios.create({
   baseURL: baseURL
});

// Intercepteur : cette fonction s'exécute AVANT chaque requête envoyée par 'api'
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

export default api;