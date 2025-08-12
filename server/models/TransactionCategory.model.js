const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Transaction = require('./Transaction.model');
const Category = require('./Category.model');

const TransactionCategory = sequelize.define('TransactionCategory', {
    // Cette table sert juste de liaison, pas besoin de champs supplémentaires
}, { timestamps: false });

Transaction.belongsToMany(Category, { through: TransactionCategory });
Category.belongsToMany(Transaction, { through: TransactionCategory });

module.exports = TransactionCategory;