'use strict';

/**
 * Corrige le nom de la colonne de clé étrangère dans SavingsParts.
 *
 * Sequelize singularise automatiquement le nom du modèle "Savings" en "Saving"
 * pour générer le nom de la FK, ce qui crée une colonne "SavingId" au lieu de
 * "SavingsId" attendu par les associations explicites et les migrations.
 *
 * Cette migration renomme "SavingId" en "SavingsId" si la colonne incorrecte existe.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('SavingsParts');

    if (tableInfo.SavingId && !tableInfo.SavingsId) {
      await queryInterface.renameColumn('SavingsParts', 'SavingId', 'SavingsId');
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('SavingsParts');

    if (tableInfo.SavingsId && !tableInfo.SavingId) {
      await queryInterface.renameColumn('SavingsParts', 'SavingsId', 'SavingId');
    }
  }
};
