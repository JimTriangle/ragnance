'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create SavingsGoals table
    await queryInterface.createTable('SavingsGoals', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      targetAmount: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      currentAmount: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
        allowNull: false
      },
      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      targetDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      archived: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      UserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create SavingsGoalContributions table
    await queryInterface.createTable('SavingsGoalContributions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      amount: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      contributionDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      SavingsGoalId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'SavingsGoals',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('SavingsGoalContributions');
    await queryInterface.dropTable('SavingsGoals');
  }
};
