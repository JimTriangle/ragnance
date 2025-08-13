import axios from "axios";

const baseURL =
  (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.replace(/\/$/, "")) ||
  "/api";

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  // withCredentials: true, // si tu utilises des cookies
});

export default api;
// usage: api.post("/auth/login", { ... })
