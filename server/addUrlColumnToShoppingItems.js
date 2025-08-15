const { DataTypes } = require('sequelize');
const sequelize = require('./config/database');

const addUrlColumnToShoppingItems = async () => {
  const queryInterface = sequelize.getQueryInterface();
  try {
    const tableDefinition = await queryInterface.describeTable('ShoppingItems');
    if (!tableDefinition.url) {
      await queryInterface.addColumn('ShoppingItems', 'url', {
        type: DataTypes.STRING,
        allowNull: true,
      });
      console.log('Colonne url ajoutée à la table ShoppingItems.');
    } else {
      console.log('La colonne url existe déjà dans la table ShoppingItems.');
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout de la colonne url:", error);
  } finally {
    await sequelize.close();
  }
};

addUrlColumnToShoppingItems();