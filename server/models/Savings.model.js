const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User.model');

const Savings = sequelize.define('Savings', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  archived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
});

// Association : Une épargne appartient à un utilisateur
Savings.belongsTo(User, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
User.hasMany(Savings);

module.exports = Savings;
