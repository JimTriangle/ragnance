const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User.model');
const Announcement = require('./Announcement.model');

const UserAnnouncement = sequelize.define('UserAnnouncement', {
  readAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
});

// Associations
User.belongsToMany(Announcement, { through: UserAnnouncement, foreignKey: 'UserId' });
Announcement.belongsToMany(User, { through: UserAnnouncement, foreignKey: 'AnnouncementId' });

module.exports = UserAnnouncement;
