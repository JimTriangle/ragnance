const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Budget = sequelize.define('Budget', {
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  month: { // Stocké de 1 à 12
    type: DataTypes.INTEGER,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

// Les associations sont définies dans models/associations.js

module.exports = Budget;