const readline = require('readline');
const bcrypt = require('bcryptjs');
const User = require('./models/User.model');
const sequelize = require('./config/database');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const createUser = async () => {
  console.log('--- Script de création d\'utilisateur ---');
  try {
    await sequelize.authenticate();
    console.log('Connexion à la base de données réussie.');

    const email = (await question('Entrez l\'email du nouvel utilisateur : ')).trim();
    const password = await question('Entrez le mot de passe : ');
    const role = (await question('Entrez le rôle (user ou admin) : ')).trim();

    if (!email || !password || !['user', 'admin'].includes(role)) {
      console.error('Erreur : Tous les champs sont requis et le rôle doit être "user" ou "admin".');
      rl.close();
      return;
    }

    const userExists = await User.findOne({ where: { email }});
    if (userExists) {
        console.error(`\nErreur : Un utilisateur avec l'email "${email}" existe déjà.`);
        rl.close();
        return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.create({
      email,
      password: hashedPassword,
      role
    });

    console.log(`\nUtilisateur "${email}" avec le rôle "${role}" créé avec succès !`);

  } catch (error) {
    console.error('\nUne erreur est survenue :', error.message);
  } finally {
    rl.close();
    await sequelize.close();
    console.log('Connexion à la base de données fermée.');
  }
};

createUser();