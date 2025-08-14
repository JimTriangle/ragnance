const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const isAuth = require('../middleware/isAuth');
const User = require('../models/User.model');

// ... (la route /register reste identique)
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe sont requis.' });
  }
  try {
    const userExists = await User.findOne({ where: { email: email } });
    if (userExists) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await User.create({
      email,
      password: hashedPassword
    });
    res.status(201).json({ message: 'Utilisateur créé avec succès !', userId: newUser.id });
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    res.status(500).json({ message: "Erreur lors de la création de l'utilisateur." });
  }
});


// --- Route pour connecter un utilisateur (corrigée) ---
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe sont requis.' });
  }
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }
    const payload = { id: user.id, email: user.email, role: user.role };
    const authToken = jwt.sign(
      payload,
      process.env.JWT_SECRET, // <-- ON UTILISE LA VARIABLE D'ENVIRONNEMENT
      { algorithm: 'HS256', expiresIn: '6h' }
    );
    res.status(200).json({ authToken: authToken });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    res.status(500).json({ message: "Erreur lors de la connexion." });
  }
});

router.get('/verify', isAuth, (req, res) => {
  res.status(200).json({ user: req.user });
});

// ... (la route /change-password reste identique, mais avec le logging d'erreur)
router.put('/change-password', isAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Veuillez fournir l'ancien et le nouveau mot de passe." });
    }
    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }
        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: "L'ancien mot de passe est incorrect." });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedNewPassword;
        await user.save();
        res.status(200).json({ message: "Mot de passe modifié avec succès." });
    } catch (error) {
        console.error("Erreur chg pwd:", error);
        res.status(500).json({ message: "Erreur lors du changement de mot de passe." });
    }
});

module.exports = router;