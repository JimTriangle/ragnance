import axios from "axios";

const baseURL = (process.env.REACT_APP_API_URL?.replace(/\/$/, "")) || "/api";

const api = axios.create({
  baseURL,
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

export default api;
