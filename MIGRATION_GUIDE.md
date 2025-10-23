# Guide de Migration - ProjectBudget Archived Field

Ce guide explique comment exécuter la migration pour ajouter le champ `archived` à la table `ProjectBudgets`.

## 📋 Prérequis

- Accès SSH au serveur de production
- Base de données SQLite sauvegardée
- Node.js et npm installés

## 🔒 Sauvegarde (IMPORTANT)

**Avant toute migration, sauvegardez votre base de données !**

```bash
# Sur le serveur de production
cd /var/www/ragnance/server
cp ragnance.sqlite ragnance.sqlite.backup-$(date +%Y%m%d-%H%M%S)
```

## 🚀 Exécution de la migration

### Option 1 : Via npm scripts (Recommandé)

```bash
# Sur le serveur de production
cd /var/www/ragnance/server

# 1. Vérifier le statut des migrations
npm run migrate:status

# 2. Exécuter la migration
npm run migrate

# 3. Vérifier que la migration a réussi
npm run migrate:status
```

### Option 2 : Via sequelize-cli directement

```bash
# Sur le serveur de production
cd /var/www/ragnance/server

# Exécuter la migration
npx sequelize-cli db:migrate

# Vérifier le statut
npx sequelize-cli db:migrate:status
```

## ✅ Vérification

Après la migration, vérifiez que la colonne a été ajoutée :

```bash
# Avec sqlite3
sqlite3 ragnance.sqlite "PRAGMA table_info(ProjectBudgets);"

# Vous devriez voir une ligne avec :
# cid | name     | type    | notnull | dflt_value | pk
# ... | archived | BOOLEAN | 1       | 0          | 0
```

## 🔄 Rollback (si nécessaire)

Si quelque chose ne va pas, vous pouvez annuler la migration :

```bash
# Annuler la dernière migration
npm run migrate:undo

# OU restaurer la sauvegarde
cp ragnance.sqlite.backup-YYYYMMDD-HHMMSS ragnance.sqlite
```

## 📝 Ce que fait cette migration

**Fichier :** `server/migrations/20251023-add-projectbudget-archived.js`

**Action :**
- Ajoute une colonne `archived` de type `BOOLEAN`
- Valeur par défaut : `false` (non archivé)
- `NOT NULL` (obligatoire)
- Tous les budgets existants auront automatiquement `archived = false`

**SQL équivalent :**
```sql
ALTER TABLE ProjectBudgets
ADD COLUMN archived BOOLEAN NOT NULL DEFAULT 0;
```

## 🐛 Dépannage

### Erreur : "No migrations were executed"

Vérifiez que :
1. Le fichier `.sequelizerc` existe dans `server/`
2. Le fichier de migration existe dans `server/migrations/`
3. Vous êtes dans le bon répertoire (`/var/www/ragnance/server`)

### Erreur : "Cannot find module 'sequelize-cli'"

Installez les dépendances :
```bash
npm install
```

### Erreur : "Database is locked"

Le serveur utilise peut-être la base de données. Arrêtez PM2 temporairement :
```bash
pm2 stop ragnance-api
npm run migrate
pm2 start ragnance-api
```

## 📊 Après la migration

Une fois la migration réussie :

1. ✅ Redémarrez le serveur backend
   ```bash
   pm2 restart ragnance-api
   ```

2. ✅ Testez la fonctionnalité
   - Accédez à la page "Budgets de Projet"
   - Cliquez sur le bouton d'archivage (✔️)
   - Vérifiez que le budget est bien archivé

3. ✅ Vérifiez les logs
   ```bash
   pm2 logs ragnance-api --lines 50
   ```

## 🔗 Liens utiles

- Documentation Sequelize Migrations : https://sequelize.org/docs/v6/other-topics/migrations/
- Guide des migrations manuelles : https://github.com/sequelize/cli#documentation

## ⚠️ Notes importantes

- ⚠️ **Ne pas** exécuter `sequelize.sync({ force: true })` en production
- ✅ **Toujours** sauvegarder avant une migration
- ✅ **Tester** d'abord sur un environnement de staging si possible
- ✅ **Vérifier** le statut après chaque migration
