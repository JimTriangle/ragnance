'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ajouter les champs de rappel pour les transactions
    await queryInterface.addColumn('Transactions', 'reminderEnabled', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });

    await queryInterface.addColumn('Transactions', 'reminderDaysBefore', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer les champs de rappel
    await queryInterface.removeColumn('Transactions', 'reminderEnabled');
    await queryInterface.removeColumn('Transactions', 'reminderDaysBefore');
  }
};
