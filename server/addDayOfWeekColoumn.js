const { DataTypes } = require('sequelize');
const sequelize = require('./config/database');

const addDayOfWeekColumn = async () => {
  const queryInterface = sequelize.getQueryInterface();
  try {
    const tableDefinition = await queryInterface.describeTable('Transactions');
    if (!tableDefinition.dayOfWeek) {
      await queryInterface.addColumn('Transactions', 'dayOfWeek', {
        type: DataTypes.INTEGER,
        allowNull: true
      });
      console.log('Colonne dayOfWeek ajoutée à la table Transactions.');
    } else {
      console.log('La colonne dayOfWeek existe déjà.');
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout de la colonne dayOfWeek:", error);
  } finally {
    await sequelize.close();
  }
};

addDayOfWeekColumn();