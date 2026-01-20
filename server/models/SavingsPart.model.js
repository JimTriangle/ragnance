const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SavingsPart = sequelize.define('SavingsPart', {
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
});

// Les associations sont définies dans models/associations.js

module.exports = SavingsPart;
