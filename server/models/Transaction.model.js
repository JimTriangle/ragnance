const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  label: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  type: { type: DataTypes.ENUM('expense', 'income'), allowNull: false },
  date: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  transactionType: { type: DataTypes.ENUM('one-time', 'recurring'), defaultValue: 'one-time' },
  frequency: { type: DataTypes.STRING },
  startDate: { type: DataTypes.DATEONLY },
  endDate: { type: DataTypes.DATEONLY, allowNull: true },
  dayOfMonth: { type: DataTypes.INTEGER },
  dayOfWeek: { type: DataTypes.INTEGER }
});

// Les associations sont définies dans models/associations.js

module.exports = Transaction;