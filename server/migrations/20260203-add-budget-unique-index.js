'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ajouter un index unique pour garantir qu'un seul budget existe
    // par combinaison UserId/CategoryId/year/month
    await queryInterface.addIndex('Budgets', ['UserId', 'CategoryId', 'year', 'month'], {
      unique: true,
      name: 'unique_user_category_year_month',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('Budgets', 'unique_user_category_year_month');
  },
};
