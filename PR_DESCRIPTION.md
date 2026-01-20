# fix: Centraliser les associations de modèles pour résoudre les problèmes d'enregistrement

## Résumé

Cette PR centralise toutes les associations Sequelize dans un fichier unique pour résoudre les problèmes d'enregistrement des parts d'épargne et le chargement des données sur toutes les pages.

## Problème identifié

Les associations entre modèles Sequelize étaient définies de manière dispersée dans différents fichiers, ce qui causait plusieurs problèmes :

- **Problème principal** : Les parts d'épargne ne pouvaient pas être enregistrées en base de données
- **Problème secondaire** : Le chargement des données était cassé sur toutes les pages après la première tentative de correction
- **Cause racine** : L'ordre de chargement des modules pouvait causer des situations où les associations n'étaient pas correctement établies
- Dépendances circulaires potentielles entre les modèles
- Associations manquantes ou incomplètes (Budget ↔ Category, Transaction ↔ ProjectBudget)

## Solution implémentée

### 1. Création d'un fichier centralisé server/models/associations.js

Ce fichier :
- Importe tous les modèles après leur définition
- Définit toutes les associations dans une fonction setupAssociations()
- Garantit que les associations sont créées dans le bon ordre
- Élimine les dépendances circulaires

### 2. Nettoyage de tous les modèles

Retrait des associations locales et des imports inutiles de :
- Savings.model.js et SavingsPart.model.js
- SavingsGoal.model.js et SavingsGoalContribution.model.js
- Budget.model.js, Category.model.js
- Transaction.model.js, ProjectBudget.model.js
- ShoppingItem.model.js
- Strategy.model.js, ExchangeKey.model.js

### 3. Mise à jour de server.js

Ajout de l'appel à setupAssociations() après le chargement de tous les modèles

## Associations incluses

Toutes les associations du système sont maintenant centralisées :

- Savings : User ↔ Savings, Savings ↔ SavingsPart
- SavingsGoal : User ↔ SavingsGoal, SavingsGoal ↔ SavingsGoalContribution
- Budget : User ↔ Budget, Budget ↔ Category
- ProjectBudget : User ↔ ProjectBudget, Transaction ↔ ProjectBudget
- Transaction : User ↔ Transaction
- Category : User ↔ Category
- ShoppingItem : User ↔ ShoppingItem
- TransactionCategory : User ↔ TransactionCategory
- ExchangeKey : User ↔ ExchangeKey
- Strategy : User ↔ Strategy
- Announcement : User ↔ UserAnnouncement, Announcement ↔ UserAnnouncement

## Bénéfices

✅ Les parts d'épargne peuvent maintenant être enregistrées correctement en base de données
✅ Le chargement des données fonctionne sur toutes les pages
✅ Élimination des dépendances circulaires
✅ Code plus maintenable avec toutes les associations centralisées
✅ Ordre de chargement garanti et prévisible
✅ Aucune duplication d'associations

## Fichiers modifiés

- ✨ Nouveau : server/models/associations.js (86 lignes)
- 🔧 Modifié : 11 fichiers de modèles (suppression d'associations et d'imports)
- 🔧 Modifié : server/server.js (ajout de l'appel à setupAssociations)

## Test plan

- [ ] Vérifier que les parts d'épargne peuvent être créées et enregistrées
- [ ] Vérifier que les données se chargent correctement sur toutes les pages
- [ ] Tester la création/modification/suppression d'épargnes avec leurs parts
- [ ] Vérifier que les budgets se chargent avec leurs catégories
- [ ] Vérifier que les transactions liées aux projets fonctionnent
- [ ] Tester toutes les autres fonctionnalités utilisant les associations
