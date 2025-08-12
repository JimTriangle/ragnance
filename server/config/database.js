const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config(); // Charge les variables d'environnement

const sequelize = new Sequelize({
  dialect: 'sqlite',
  // On utilise la variable d'environnement pour le chemin
  storage: path.join(__dirname, '..', process.env.DB_STORAGE_PATH || 'ragnance.sqlite'),
  logging: false
});

module.exports = sequelize;