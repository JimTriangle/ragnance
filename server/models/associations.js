/**
 * Fichier centralisé pour définir toutes les associations entre modèles
 * Ce fichier doit être chargé APRÈS tous les modèles individuels
 */

const User = require('./User.model');
const Category = require('./Category.model');
const Transaction = require('./Transaction.model');
const ShoppingItem = require('./ShoppingItem.model');
const Budget = require('./Budget.model');
const ProjectBudget = require('./ProjectBudget.model');
const Savings = require('./Savings.model');
const SavingsPart = require('./SavingsPart.model');
const SavingsGoal = require('./SavingsGoal.model');
const SavingsGoalContribution = require('./SavingsGoalContribution.model');
const TransactionCategory = require('./TransactionCategory.model');
const ExchangeKey = require('./ExchangeKey.model');
const Strategy = require('./Strategy.model');
const Announcement = require('./Announcement.model');
const UserAnnouncement = require('./UserAnnouncement.model');
const ConfigEmail = require('./ConfigEmail.model');

// Définir toutes les associations ici
function setupAssociations() {
  // Savings associations
  Savings.belongsTo(User, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
  User.hasMany(Savings);

  // SavingsPart associations
  SavingsPart.belongsTo(Savings, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
  Savings.hasMany(SavingsPart, { as: 'parts' });

  // SavingsGoal associations
  SavingsGoal.belongsTo(User, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
  User.hasMany(SavingsGoal);

  // SavingsGoalContribution associations
  SavingsGoalContribution.belongsTo(SavingsGoal, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
  SavingsGoal.hasMany(SavingsGoalContribution, { as: 'contributions' });

  // Budget associations
  Budget.belongsTo(User, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
  User.hasMany(Budget);
  Budget.belongsTo(Category, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
  Category.hasMany(Budget);

  // ProjectBudget associations
  ProjectBudget.belongsTo(User, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
  User.hasMany(ProjectBudget);

  // Transaction associations
  Transaction.belongsTo(User, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
  User.hasMany(Transaction);
  Transaction.belongsTo(ProjectBudget, { foreignKey: { name: 'ProjectBudgetId', allowNull: true }, onDelete: 'SET NULL' });
  ProjectBudget.hasMany(Transaction, { foreignKey: { name: 'ProjectBudgetId', allowNull: true } });

  // Category associations
  Category.belongsTo(User, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
  User.hasMany(Category);

  // ShoppingItem associations
  ShoppingItem.belongsTo(User, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
  User.hasMany(ShoppingItem);

  // TransactionCategory associations
  TransactionCategory.belongsTo(User, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
  User.hasMany(TransactionCategory);

  // ExchangeKey associations
  ExchangeKey.belongsTo(User, { foreignKey: { name: 'userId', allowNull: false }, onDelete: 'CASCADE' });
  User.hasMany(ExchangeKey, { foreignKey: { name: 'userId', allowNull: false } });

  // Strategy associations
  Strategy.belongsTo(User, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
  User.hasMany(Strategy);

  // Announcement and UserAnnouncement associations
  UserAnnouncement.belongsTo(User, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
  UserAnnouncement.belongsTo(Announcement, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });
  User.hasMany(UserAnnouncement);
  Announcement.hasMany(UserAnnouncement);

  console.log('✓ Associations de modèles configurées avec succès');
}

module.exports = { setupAssociations };
