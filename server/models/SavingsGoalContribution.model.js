const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const SavingsGoal = require('./SavingsGoal.model');

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

// Association : Une contribution appartient à un objectif d'épargne
SavingsGoalContribution.belongsTo(SavingsGoal, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
SavingsGoal.hasMany(SavingsGoalContribution, { as: 'contributions' });

module.exports = SavingsGoalContribution;
