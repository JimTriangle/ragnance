const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Strategy = sequelize.define('Strategy', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  kind: { type: DataTypes.STRING, allowNull: false },
  params: { type: DataTypes.JSON, allowNull: false },
  backtestsCount: { type: DataTypes.INTEGER, defaultValue: 0 }
});

// Les associations sont définies dans models/associations.js

module.exports = Strategy;