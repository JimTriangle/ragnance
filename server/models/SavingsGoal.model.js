const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SavingsGoal = sequelize.define('SavingsGoal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  targetAmount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  currentAmount: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  targetDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  archived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  UserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  timestamps: true
});

// Les associations sont définies dans models/associations.js

module.exports = SavingsGoal;
