const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User.model');

const ExchangeKey = sequelize.define('ExchangeKey', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  exchange: {
    type: DataTypes.ENUM('KRAKEN', 'BINANCE'),
    allowNull: false,
  },
  label: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  apiKey: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  apiSecretEnc: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  sandbox: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  meta: {
    type: DataTypes.JSON,
    defaultValue: {
      lastTestStatus: 'UNTESTED',
    },
  },
});

ExchangeKey.belongsTo(User, { foreignKey: { name: 'userId', allowNull: false }, onDelete: 'CASCADE' });
User.hasMany(ExchangeKey, { foreignKey: { name: 'userId', allowNull: false } });

module.exports = ExchangeKey;
