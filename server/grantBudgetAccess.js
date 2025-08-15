// install via: npm install sqlite3
const sqlite3 = require('sqlite3').verbose();

// Ouvrir ou créer la base de données
const db = new sqlite3.Database('./ragnance.sqlite', (err) => {
  if (err) {
    console.error('Erreur lors de l’ouverture de la base :', err.message);
  } else {
    console.log('Connexion à la base SQLite réussie.');
  }
});

// Activer le mode sérialisé pour s’assurer que les requêtes s’exécutent l’une après l’autre
db.serialize(() => {
  // Exemple : mettre le champ budget_access à 1 pour tous les utilisateurs
  const sql = `UPDATE Users SET budgetAccess = 1`;
  db.run(sql, function (err) {
    if (err) {
      console.error('Erreur lors de la mise à jour :', err.message);
    } else {
      console.log(`Budget activé pour ${this.changes} utilisateur(s).`);
    }
  });
});

// Fermer la connexion
db.close((err) => {
  if (err) {
    console.error('Erreur lors de la fermeture de la base :', err.message);
  } else {
    console.log('Connexion fermée.');
  }
});
