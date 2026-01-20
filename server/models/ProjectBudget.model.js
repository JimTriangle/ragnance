const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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

// Les associations sont définies dans models/associations.js

module.exports = ProjectBudget;