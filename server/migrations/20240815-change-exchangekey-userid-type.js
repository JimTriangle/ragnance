'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('ExchangeKeys', 'userId', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('ExchangeKeys', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};