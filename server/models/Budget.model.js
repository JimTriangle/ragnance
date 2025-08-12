const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User.model');
const Category = require('./Category.model');

const Budget = sequelize.define('Budget', {
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  month: { // Stocké de 1 à 12
    type: DataTypes.INTEGER,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

// Associations
Budget.belongsTo(User, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
User.hasMany(Budget);

Budget.belongsTo(Category, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
Category.hasMany(Budget);

module.exports = Budget;