const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Savings = sequelize.define('Savings', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  archived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
});

// Les associations sont définies dans models/associations.js

module.exports = Savings;
