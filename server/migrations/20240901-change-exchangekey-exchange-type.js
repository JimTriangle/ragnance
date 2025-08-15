'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('ExchangeKeys', 'exchange', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('ExchangeKeys', 'exchange', {
      type: Sequelize.ENUM('KRAKEN', 'BINANCE'),
      allowNull: false,
    });
  },
};