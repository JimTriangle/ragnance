'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Announcements table
    await queryInterface.createTable('Announcements', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.STRING,
        defaultValue: 'feature'
      },
      publishedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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

    // Create UserAnnouncements join table
    await queryInterface.createTable('UserAnnouncements', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
      AnnouncementId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Announcements',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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

    // Add unique constraint to prevent duplicate reads
    await queryInterface.addIndex('UserAnnouncements', ['UserId', 'AnnouncementId'], {
      unique: true,
      name: 'user_announcement_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('UserAnnouncements');
    await queryInterface.dropTable('Announcements');
  }
};
