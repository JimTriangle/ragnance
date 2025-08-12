const readline = require('readline');
const bcrypt = require('bcryptjs');
const User = require('./models/User.model');
const sequelize = require('./config/database');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const resetPassword = async () => {
  console.log('--- Script de réinitialisation de mot de passe ---');
  try {
    await sequelize.authenticate();
    console.log('Connexion à la base de données réussie.');

    const email = (await question('Entrez l\'email de l\'utilisateur : ')).trim();
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.error(`\nErreur : Aucun utilisateur trouvé avec l'email "${email}".`);
      rl.close();
      return;
    }

    console.log(`Utilisateur trouvé : ${user.email}`);
    const newPassword = await question('Entrez le NOUVEAU mot de passe : ');

    if (!newPassword) {
        console.error('\nErreur : Le mot de passe ne peut pas être vide.');
        rl.close();
        return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    console.log(`\nSuccès ! Le mot de passe pour "${email}" a été réinitialisé.`);

  } catch (error) {
    console.error('\nUne erreur est survenue :', error.message);
  } finally {
    rl.close();
    await sequelize.close();
    console.log('Connexion à la base de données fermée.');
  }
};

resetPassword();