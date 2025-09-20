try {
  require('dotenv').config();
} catch (error) {
  if (error?.code === 'MODULE_NOT_FOUND') {
    console.warn(
      "Module 'dotenv' introuvable. Les variables d'environnement doivent être fournies par le système."
    );
  } else {
    throw error;
  }
}

// Définir un environnement par défaut uniquement s'il n'est pas déjà précisé
// afin de permettre le démarrage du serveur en mode production lorsque
// NODE_ENV=production est fourni en dehors de ce script.
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');
const http = require('http');
const cors = require('cors');
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
const DEFAULT_PORT = 5000;

const resolvePort = () => {
  const candidates = [
    { key: 'SERVER_PORT', value: process.env.SERVER_PORT },
    { key: 'API_PORT', value: process.env.API_PORT },
    { key: 'BACKEND_PORT', value: process.env.BACKEND_PORT },
    { key: 'PORT', value: process.env.PORT }
  ];

  for (const { key, value } of candidates) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    const parsed = Number.parseInt(value, 10);

    if (Number.isNaN(parsed)) {
      console.warn(
        `La valeur "${value}" fournie pour ${key} n'est pas un numéro de port valide. Utilisation du port par défaut ${DEFAULT_PORT}.`
      );
      return DEFAULT_PORT;
    }

    if (
      key === 'PORT' &&
      parsed === 3000 &&
      process.env.NODE_ENV === 'development' &&
      !process.env.SERVER_PORT &&
      !process.env.API_PORT &&
      !process.env.BACKEND_PORT
    ) {
      console.warn(
        'La variable d\'environnement PORT=3000 correspond au port par défaut du client. ' +
        `Utilisation du port par défaut ${DEFAULT_PORT} pour éviter les conflits. ` +
        'Définissez SERVER_PORT (ou API_PORT/BACKEND_PORT) pour forcer un autre port.'
      );
      return DEFAULT_PORT;
    }

    return parsed;
  }

  return DEFAULT_PORT;
};

const PORT = resolvePort();
const { setupBotLogWebSocket } = require('./services/botLogs.js');
const defaultAllowedOrigins = ['https://ragnance.fr'];
const envAllowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
  : [];

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];

if (process.env.NODE_ENV === 'development' && !allowedOrigins.includes('http://localhost:3000')) {
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
    origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, origin || true);
    }

    console.warn(`Requête CORS refusée pour l'origine "${origin}".`);
    return callback(null, false);
  },
  credentials: true
}));
/*
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "https://ragnance.fr");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
*/
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

