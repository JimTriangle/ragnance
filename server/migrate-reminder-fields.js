/**
 * Script de migration pour ajouter les champs de rappel aux transactions
 * Ce script ajoute les colonnes reminderEnabled et reminderDaysBefore à la table Transactions
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Chemins possibles pour la base de données
const possiblePaths = [
  path.resolve(__dirname, 'ragnance.sqlite'),
  path.resolve(__dirname, 'var/data/ragnance.sqlite'),
  path.resolve(__dirname, 'old_ragnance.sqlite')
];

// Trouver la base de données existante
const fs = require('fs');
let dbPath = null;

for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    console.log(`Base de données trouvée: ${p}`);
    dbPath = p;
    break;
  }
}

if (!dbPath) {
  console.error('Aucune base de données trouvée aux emplacements:', possiblePaths);
  process.exit(1);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err);
    process.exit(1);
  }
  console.log('Connecté à la base de données SQLite');
});

// Fonction pour vérifier si une colonne existe
function columnExists(tableName, columnName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      const exists = rows.some(row => row.name === columnName);
      resolve(exists);
    });
  });
}

// Fonction pour ajouter une colonne
function addColumn(tableName, columnName, columnType) {
  return new Promise((resolve, reject) => {
    const sql = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`;
    db.run(sql, (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log(`✓ Colonne ${columnName} ajoutée à la table ${tableName}`);
      resolve();
    });
  });
}

// Migration principale
async function migrate() {
  try {
    console.log('\n=== Migration des champs de rappel ===\n');

    // Vérifier et ajouter reminderEnabled
    const hasReminderEnabled = await columnExists('Transactions', 'reminderEnabled');
    if (hasReminderEnabled) {
      console.log('✓ La colonne reminderEnabled existe déjà');
    } else {
      await addColumn('Transactions', 'reminderEnabled', 'BOOLEAN DEFAULT 0 NOT NULL');
    }

    // Vérifier et ajouter reminderDaysBefore
    const hasReminderDaysBefore = await columnExists('Transactions', 'reminderDaysBefore');
    if (hasReminderDaysBefore) {
      console.log('✓ La colonne reminderDaysBefore existe déjà');
    } else {
      await addColumn('Transactions', 'reminderDaysBefore', 'INTEGER');
    }

    console.log('\n=== Migration terminée avec succès ===\n');

  } catch (error) {
    console.error('\n!!! Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Erreur lors de la fermeture de la base de données:', err);
      } else {
        console.log('Connexion à la base de données fermée');
      }
    });
  }
}

// Exécuter la migration
migrate();
