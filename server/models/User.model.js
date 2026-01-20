const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  // Le champ 'id' est créé automatiquement par Sequelize
  email: {
    type: DataTypes.STRING,
    allowNull: false, // Ne peut pas être nul
    unique: true, // Doit être unique
    validate: {
      isEmail: true // Valide le format de l'email
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user', // Valeur par défaut
    validate: {
      isIn: [['user', 'admin']] // La valeur doit être 'user' ou 'admin'
    }
  },
  budgetAccess: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  tradingAccess: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  contact: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
  // Les champs 'createdAt' et 'updatedAt' sont ajoutés automatiquement
});

module.exports = User;