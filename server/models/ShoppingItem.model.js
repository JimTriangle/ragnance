const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isPurchased: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

// Les associations sont définies dans models/associations.js

module.exports = ShoppingItem;