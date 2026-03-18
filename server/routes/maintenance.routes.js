const express = require('express');
const fs = require('fs');
const router = express.Router();
const { isMaintenanceActive, MAINTENANCE_FLAG_PATH } = require('../middleware/maintenance');
const isAuth = require('../middleware/isAuth');

// GET /api/maintenance/status — accessible sans auth (pour le front)
router.get('/status', (req, res) => {
  res.json({ maintenance: isMaintenanceActive() });
});

// POST /api/maintenance/enable — admin uniquement
router.post('/enable', isAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé.' });
  }
  try {
    fs.writeFileSync(MAINTENANCE_FLAG_PATH, new Date().toISOString(), 'utf-8');
    res.json({ maintenance: true, message: 'Mode maintenance activé.' });
  } catch (err) {
    console.error('Erreur activation maintenance:', err);
    res.status(500).json({ message: 'Impossible d\'activer le mode maintenance.' });
  }
});

// POST /api/maintenance/disable — admin uniquement
router.post('/disable', isAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé.' });
  }
  try {
    if (fs.existsSync(MAINTENANCE_FLAG_PATH)) {
      fs.unlinkSync(MAINTENANCE_FLAG_PATH);
    }
    res.json({ maintenance: false, message: 'Mode maintenance désactivé.' });
  } catch (err) {
    console.error('Erreur désactivation maintenance:', err);
    res.status(500).json({ message: 'Impossible de désactiver le mode maintenance.' });
  }
});

module.exports = router;
