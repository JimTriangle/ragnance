const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User.model');
const ProjectBudget = require('./ProjectBudget.model');

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

Transaction.belongsTo(User, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
User.hasMany(Transaction);
Transaction.belongsTo(ProjectBudget, { foreignKey: { name: 'ProjectBudgetId', allowNull: true }, onDelete: 'SET NULL' });
ProjectBudget.hasMany(Transaction, { foreignKey: { name: 'ProjectBudgetId', allowNull: true } });

module.exports = Transaction;