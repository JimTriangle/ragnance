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
  startDate: { type: DataTypes.DATEONLY },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  archived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
});

// Association : Un budget de projet appartient à un utilisateur
ProjectBudget.belongsTo(User, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
User.hasMany(ProjectBudget);

module.exports = ProjectBudget;