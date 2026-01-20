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
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['KRAKEN', 'BINANCE']],
    },
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

// Les associations sont définies dans models/associations.js

module.exports = ExchangeKey;
