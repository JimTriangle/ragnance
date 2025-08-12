import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api'
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