/**
 * Script de migration pour ajouter un index unique sur la table Budgets
 * Garantit qu'un seul budget peut exister par combinaison UserId/CategoryId/year/month
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Chemins possibles pour la base de données
const possiblePaths = [
  path.resolve(__dirname, 'ragnance.sqlite'),
  path.resolve(__dirname, 'var/data/ragnance.sqlite'),
  path.resolve(__dirname, 'old_ragnance.sqlite')
];

// Trouver la base de données existante
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

// Fonction pour vérifier si un index existe
function indexExists(indexName) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT name FROM sqlite_master WHERE type='index' AND name=?`, [indexName], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(!!row);
    });
  });
}

// Fonction pour supprimer les doublons avant de créer l'index unique
function removeDuplicateBudgets() {
  return new Promise((resolve, reject) => {
    // Garder le budget le plus récent (plus grand id) pour chaque combinaison unique
    const sql = `
      DELETE FROM Budgets
      WHERE id NOT IN (
        SELECT MAX(id)
        FROM Budgets
        GROUP BY UserId, CategoryId, year, month
      )
    `;
    db.run(sql, function(err) {
      if (err) {
        reject(err);
        return;
      }
      if (this.changes > 0) {
        console.log(`✓ ${this.changes} budget(s) dupliqué(s) supprimé(s)`);
      } else {
        console.log('✓ Aucun doublon trouvé');
      }
      resolve();
    });
  });
}

// Fonction pour créer l'index unique
function createUniqueIndex() {
  return new Promise((resolve, reject) => {
    const sql = `CREATE UNIQUE INDEX IF NOT EXISTS unique_user_category_year_month ON Budgets (UserId, CategoryId, year, month)`;
    db.run(sql, (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('✓ Index unique créé sur Budgets (UserId, CategoryId, year, month)');
      resolve();
    });
  });
}

// Migration principale
async function migrate() {
  try {
    console.log('\n=== Migration: Index unique pour les budgets mensuels indépendants ===\n');

    // Vérifier si l'index existe déjà
    const exists = await indexExists('unique_user_category_year_month');
    if (exists) {
      console.log('✓ L\'index unique existe déjà');
      return;
    }

    // Supprimer les doublons éventuels avant de créer l'index
    await removeDuplicateBudgets();

    // Créer l'index unique
    await createUniqueIndex();

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
