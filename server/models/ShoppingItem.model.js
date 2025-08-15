const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User.model');

const ShoppingItem = sequelize.define('ShoppingItem', {
  itemName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
    url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isPurchased: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

ShoppingItem.belongsTo(User, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
User.hasMany(ShoppingItem);

module.exports = ShoppingItem;