const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserAnnouncement = sequelize.define('UserAnnouncement', {
  readAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
});

// Les associations sont définies dans models/associations.js

module.exports = UserAnnouncement;
