const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SavingsGoalContribution = sequelize.define('SavingsGoalContribution', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  contributionDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  SavingsGoalId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'SavingsGoals',
      key: 'id'
    }
  }
}, {
  timestamps: true
});

// Les associations sont définies dans models/associations.js

module.exports = SavingsGoalContribution;
