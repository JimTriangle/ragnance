require('dotenv').config();
const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');
const http = require('http');
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

const isAuth = require('./middleware/isAuth');
const hasBudgetAccess = require('./middleware/hasBudgetAccess');
const hasTradingAccess = require('./middleware/hasTradingAccess');

const app = express();
// On utilise la variable d'environnement pour le port
const PORT = process.env.PORT || 5000;
const { setupBotLogWebSocket } = require('./services/botLogs');
const allowedOrigins = ['http://ragnance.fr', 'https://ragnance.fr', 'https://www.ragnance.fr','http://www.ragnance.fr'];
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
app.options('*', cors({ origin: allowedOrigins, credentials: true }));

app.use(express.json()); 

// ... (toutes les déclarations de routes)
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/transactions', isAuth, hasBudgetAccess, require('./routes/transaction.routes.js'));
app.use('/api/shopping', isAuth, hasBudgetAccess, require('./routes/shopping.routes.js'));
app.use('/api/admin', require('./routes/admin.routes.js'));
app.use('/api/categories', isAuth, hasBudgetAccess, require('./routes/category.routes.js'));
app.use('/api/budgets', isAuth, hasBudgetAccess, require('./routes/budget.routes.js'));
app.use('/api/project-budgets', isAuth, hasBudgetAccess, require('./routes/ProjectBudget.routes.js'));
app.use('/api/analysis', isAuth, hasBudgetAccess, require('./routes/analysis.routes.js'));
app.use('/api/dashboard', isAuth, hasTradingAccess, require('./routes/dashboard.routes.js'));
app.use('/api/portfolios', isAuth, hasTradingAccess, require('./routes/portfolio.routes'));
app.use('/api/markets', isAuth, hasTradingAccess, require('./routes/market.routes'));
app.use('/api/exchanges', isAuth, hasTradingAccess, require('./routes/exchange.routes'));
app.use('/api/backtests', isAuth, hasTradingAccess, require('./routes/backtest.routes'));
app.use('/api', isAuth, hasTradingAccess, require('./routes/strategy.routes'));
app.use('/api', isAuth, hasTradingAccess, require('./routes/strategies.routes'));
app.use('/api/bot', isAuth, hasTradingAccess, require('./routes/bot.routes'));
app.use('/api/bots', isAuth, hasTradingAccess, require('./routes/bots.routes'));
if (process.env.ADX_EMA_RSI_ENABLED === 'true') {
  app.use('/api', isAuth, hasTradingAccess, require('./routes/strategyInstance.routes'));
}


const openapiDocument = yaml.load(path.join(__dirname, 'openapi.yaml'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));

const server = http.createServer(app);
setupBotLogWebSocket(server);

server.listen(PORT, () => {
  console.log(`Serveur Ragnance démarré sur http://localhost:${PORT}`);
});

