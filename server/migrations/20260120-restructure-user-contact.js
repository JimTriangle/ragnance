'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Supprimer l'ancien champ contact générique
    await queryInterface.removeColumn('Users', 'contact');

    // Ajouter les nouveaux champs de contact structurés
    await queryInterface.addColumn('Users', 'phone', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'address', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'city', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'postalCode', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'country', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer les nouveaux champs
    await queryInterface.removeColumn('Users', 'phone');
    await queryInterface.removeColumn('Users', 'address');
    await queryInterface.removeColumn('Users', 'city');
    await queryInterface.removeColumn('Users', 'postalCode');
    await queryInterface.removeColumn('Users', 'country');

    // Restaurer l'ancien champ contact
    await queryInterface.addColumn('Users', 'contact', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  }
};
