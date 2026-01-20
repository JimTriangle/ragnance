const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#CCCCCC'
  },
  // ON AJOUTE CE CHAMP
  isTrackedMonthly: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

// Les associations sont définies dans models/associations.js

module.exports = Category;