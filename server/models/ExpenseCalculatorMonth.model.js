const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExpenseCalculatorMonth = sequelize.define('ExpenseCalculatorMonth', {
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  month: { // 1 à 12
    type: DataTypes.INTEGER,
    allowNull: false
  },
  people: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]',
    get() {
      const raw = this.getDataValue('people');
      try { return JSON.parse(raw); } catch { return []; }
    },
    set(value) {
      this.setDataValue('people', JSON.stringify(value));
    }
  },
  expenses: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]',
    get() {
      const raw = this.getDataValue('expenses');
      try { return JSON.parse(raw); } catch { return []; }
    },
    set(value) {
      this.setDataValue('expenses', JSON.stringify(value));
    }
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['UserId', 'year', 'month'],
      name: 'unique_user_year_month_expense_calc'
    }
  ]
});

// Les associations sont définies dans models/associations.js

module.exports = ExpenseCalculatorMonth;
