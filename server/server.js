const express = require('express');
const cors =require('cors');
const sequelize = require('./config/database');
require('dotenv').config(); // Charge les variables d'environnement

// ... (tous les require des modèles)
require('./models/User.model');
require('./models/Category.model');
require('./models/Transaction.model');
require('./models/ShoppingItem.model');
require('./models/Budget.model');
require('./models/ProjectBudget.model.js');
require('./models/TransactionCategory.model');

const app = express();
// On utilise la variable d'environnement pour le port
const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => console.log('Connexion à la base de données SQLite réussie.'))
  .catch(err => console.error('Impossible de se connecter à la base de données:', err));

// sequelize.sync() est utile pour le développement. Pour la production,
// il est fortement recommandé d'utiliser un système de migrations
// (ex: sequelize-cli) pour suivre et appliquer les changements de schéma
// de manière contrôlée et sécurisée sans risquer de perdre des données.
sequelize.sync({ force: false })
  .then(() => console.log('Tables de la BDD synchronisées.'));

app.use(cors()); 
app.use(express.json()); 

// ... (toutes les déclarations de routes)
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/transactions', require('./routes/transaction.routes.js'));
app.use('/api/shopping', require('./routes/shopping.routes.js'));
app.use('/api/admin', require('./routes/admin.routes.js'));
app.use('/api/categories', require('./routes/category.routes.js'));
app.use('/api/budgets', require('./routes/budget.routes.js'));
app.use('/api/project-budgets', require('./routes/ProjectBudget.routes.js'));
app.use('/api/analysis', require('./routes/analysis.routes.js'));

app.listen(PORT, () => {
  console.log(`Serveur Ragnance démarré sur http://localhost:${PORT}`);
});

