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
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      budgetAccess: user.budgetAccess,
      tradingAccess: user.tradingAccess
    };
    const authToken = jwt.sign(
      payload,
      process.env.JWT_SECRET, // <-- ON UTILISE LA VARIABLE D'ENVIRONNEMENT
      { algorithm: 'HS256', expiresIn: '6h' }
    );
    user.lastLogin = new Date();
    await user.save();
    res.set('Cache-Control', 'no-store');
    res.status(200).json({ authToken: authToken });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    res.status(500).json({ message: "Erreur lors de la connexion." });
  }
});

router.post('/refresh', async (req, res) => {
  const authHeader = req.get('Authorization') || '';
  const parts = authHeader.split(' ');
  const token = parts.length === 2 && /^Bearer$/i.test(parts[0]) ? parts[1] : null;

  if (!token) {
    return res.status(401).json({ message: 'Token manquant.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur introuvable.' });
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      budgetAccess: user.budgetAccess,
      tradingAccess: user.tradingAccess
    };

    const authToken = jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '6h' });
    res.set('Cache-Control', 'no-store');
    return res.status(200).json({ authToken });
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token invalide.' });
    }
    return res.status(500).json({ message: 'Erreur lors du rafraîchissement du token.' });
  }
});

// Health check endpoint (public, sans auth)
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
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

router.put('/update-contact', isAuth, async (req, res) => {
  const { contact } = req.body;
  const userId = req.user.id;
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }
    user.contact = contact;
    await user.save();
    res.status(200).json({ message: "Informations de contact mises à jour avec succès.", contact: user.contact });
  } catch (error) {
    console.error("Erreur mise à jour contact:", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour des informations de contact." });
  }
});

router.get('/contact', isAuth, async (req, res) => {
  const userId = req.user.id;
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }
    res.status(200).json({ contact: user.contact || '' });
  } catch (error) {
    console.error("Erreur récupération contact:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des informations de contact." });
  }
});

module.exports = router;