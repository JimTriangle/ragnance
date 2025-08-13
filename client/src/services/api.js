// client/src/services/api.js
import axios from "axios";

/**
 * Base URL de l'API :
 * - En prod, tu peux définir REACT_APP_API_URL (ex: https://ragnance.fr/api)
 * - Sinon, fallback sur le chemin relatif "/api" (géré par Nginx)
 * On retire un éventuel "/" final pour éviter les doubles "//".
 */
const baseURL =
  (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.replace(/\/$/, "")) ||
  "/api";

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  // Mets à true si ton backend utilise des cookies/sessions (sinon laisse commenté)
  // withCredentials: true,
});

export default api;

// Exemple d’usage ailleurs dans ton code :
// api.post("/auth/login", { email, password })
