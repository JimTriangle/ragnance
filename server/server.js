require('dotenv').config();
const express = require('express');

const cors =require('cors');
const sequelize = require('./config/database');

// ... (tous les require des modèles)
require('./models/User.model');
require('./models/Category.model');
require('./models/Transaction.model');
require('./models/ShoppingItem.model');
require('./models/Budget.model');
require('./models/ProjectBudget.model.js');
require('./models/TransactionCategory.model');
require('./models/ExchangeKey.model');
require('./models/Strategy.model');

const app = express();
// On utilise la variable d'environnement pour le port
const PORT = process.env.PORT || 5000;

const allowedOrigins = ['http://ragnance.fr', 'https://ragnance.fr', 'https://www.ragnance.fr'];
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:3000');
}

sequelize.authenticate()
  .then(() => console.log('Connexion à la base de données SQLite réussie.'))
  .catch(err => console.error('Impossible de se connecter à la base de données:', err));

// sequelize.sync() est utile pour le développement. Pour la production,
// il est fortement recommandé d'utiliser un système de migrations
// (ex: sequelize-cli) pour suivre et appliquer les changements de schéma
// de manière contrôlée et sécurisée sans risquer de perdre des données.
sequelize.sync({ force: false })
   .then(async () => {
    console.log('Tables de la BDD synchronisées.');
    // seed minimal pour les clés d\'exchange
    try {
      await require('./seed/exchangeKeysSeed')();
    } catch (e) {
      console.error('Seed exchange keys failed:', e.message);
    }
    try {
      await require('./seed/strategySeed')();
    } catch (e) {
      console.error('Seed strategies failed:', e.message);
    }
  });

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

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
app.use('/api/dashboard', require('./routes/dashboard.routes.js'));
app.use('/api/portfolios', require('./routes/portfolio.routes'));
app.use('/api/markets', require('./routes/market.routes'));
app.use('/api/exchanges', require('./routes/exchange.routes'));
app.use('/api/backtests', require('./routes/backtest.routes'));
app.use('/api', require('./routes/strategy.routes'));
app.use('/api', require('./routes/strategies.routes'));
app.use('/api/bot', require('./routes/bot.routes'));

app.listen(PORT, () => {
  console.log(`Serveur Ragnance démarré sur http://localhost:${PORT}`);
});

