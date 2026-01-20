const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TransactionCategory = sequelize.define('TransactionCategory', {
    // Cette table sert juste de liaison, pas besoin de champs supplémentaires
}, { timestamps: false });

// Les associations sont définies dans models/associations.js

module.exports = TransactionCategory;