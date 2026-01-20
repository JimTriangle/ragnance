const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConfigEmail = sequelize.define('ConfigEmail', {
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isIn: [['contact', 'privacy']]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  }
});

module.exports = ConfigEmail;
