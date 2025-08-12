const readline = require('readline');
const User = require('./models/User.model');
const sequelize = require('./config/database');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const updateUserRole = async () => {
  console.log('--- Script de mise à jour du rôle utilisateur ---');
  try {
    await sequelize.authenticate();
    console.log('Connexion à la base de données réussie.');

    const email = await question('Entrez l\'email de l\'utilisateur à modifier : ');
    const newRole = await question('Entrez le nouveau rôle (user ou admin) : ');

    if (!email || !['user', 'admin'].includes(newRole)) {
      console.error('Erreur : L\'email est requis et le rôle doit être "user" ou "admin".');
      rl.close();
      return;
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.error(`Erreur : Aucun utilisateur trouvé avec l'email "${email}".`);
      rl.close();
      return;
    }

    user.role = newRole;
    await user.save();

    console.log(`\nSuccès ! Le rôle de l'utilisateur "${email}" a été mis à jour à "${newRole}".`);

  } catch (error) {
    console.error('\nUne erreur est survenue :', error.message);
  } finally {
    rl.close();
    await sequelize.close();
    console.log('Connexion à la base de données fermée.');
  }
};

updateUserRole();