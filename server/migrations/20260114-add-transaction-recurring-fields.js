'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Transactions', 'parentRecurringId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Transactions',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    await queryInterface.addColumn('Transactions', 'excludedDates', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: []
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Transactions', 'parentRecurringId');
    await queryInterface.removeColumn('Transactions', 'excludedDates');
  },
};
