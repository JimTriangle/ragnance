'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ShoppingItems', 'imageUrl', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('ShoppingItems', 'imageUrl');
  }
};
