const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User.model');

const Category = sequelize.define('Category', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#CCCCCC'
  },
  // ON AJOUTE CE CHAMP
  isTrackedMonthly: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

// Association : Une catégorie appartient à un utilisateur
Category.belongsTo(User, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
User.hasMany(Category);

module.exports = Category;