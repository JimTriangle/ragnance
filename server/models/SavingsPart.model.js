const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Savings = require('./Savings.model');

const SavingsPart = sequelize.define('SavingsPart', {
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
});

// Association : Une part appartient à une épargne
SavingsPart.belongsTo(Savings, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
Savings.hasMany(SavingsPart, { as: 'parts' });

module.exports = SavingsPart;
