const fs = require('fs');
const path = require('path');

const MAINTENANCE_FLAG_PATH = path.join(__dirname, '..', 'maintenance.flag');

/**
 * Vérifie si le mode maintenance est activé (présence du fichier maintenance.flag).
 */
const isMaintenanceActive = () => {
  try {
    return fs.existsSync(MAINTENANCE_FLAG_PATH);
  } catch {
    return false;
  }
};

/**
 * Middleware Express qui bloque les requêtes non essentielles
 * lorsque le mode maintenance est activé.
 * Les routes publiques (health check, login, refresh) restent accessibles.
 */
const maintenanceMiddleware = (req, res, next) => {
  if (!isMaintenanceActive()) {
    return next();
  }

  // Laisser passer les OPTIONS (preflight CORS)
  if (req.method === 'OPTIONS') {
    return next();
  }

  // Routes toujours accessibles même en maintenance
  const allowedPaths = ['/auth/health', '/auth/login', '/auth/refresh', '/maintenance/status'];
  const normalizedPath = req.path.replace(/\/+$/, '') || '/';
  if (allowedPaths.includes(normalizedPath)) {
    return next();
  }

  return res.status(503).json({
    maintenance: true,
    message: 'Une mise à jour est en cours. Veuillez patienter quelques instants avant de réessayer.'
  });
};

module.exports = { maintenanceMiddleware, isMaintenanceActive, MAINTENANCE_FLAG_PATH };
