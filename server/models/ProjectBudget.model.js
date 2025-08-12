const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User.model');

const ProjectBudget = sequelize.define('ProjectBudget', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  }
});

// Association : Un budget de projet appartient à un utilisateur
ProjectBudget.belongsTo(User, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
User.hasMany(ProjectBudget);

module.exports = ProjectBudget;