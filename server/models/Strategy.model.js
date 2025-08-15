const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User.model');

const Strategy = sequelize.define('Strategy', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  kind: { type: DataTypes.STRING, allowNull: false },
  params: { type: DataTypes.JSON, allowNull: false },
  backtestsCount: { type: DataTypes.INTEGER, defaultValue: 0 }
});

Strategy.belongsTo(User, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
User.hasMany(Strategy);

module.exports = Strategy;