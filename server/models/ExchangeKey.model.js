const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
    type: DataTypes.ENUM('BINANCE', 'KRAKEN'),
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

module.exports = ExchangeKey;