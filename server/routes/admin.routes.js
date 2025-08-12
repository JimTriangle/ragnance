const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const isAuth = require('../middleware/isAuth');
const isAdmin = require('../middleware/isAdmin');
const User = require('../models/User.model');

// GET /api/admin/users - Lister tous les utilisateurs (existant)
router.get('/users', [isAuth, isAdmin], async (req, res) => {
    try {
        const users = await User.findAll({ attributes: { exclude: ['password'] } });
        res.status(200).json(users);
    } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});

// --- NOUVELLE ROUTE : CRÉER UN UTILISATEUR ---
// POST /api/admin/users
router.post('/users', [isAuth, isAdmin], async (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
        return res.status(400).json({ message: "Email, mot de passe et rôle sont requis." });
    }
    try {
        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: "Cet email est déjà utilisé." });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = await User.create({ email, password: hashedPassword, role });
        res.status(201).json({ id: newUser.id, email: newUser.email, role: newUser.role });
    } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});

// --- NOUVELLE ROUTE : MODIFIER UN UTILISATEUR ---
// PUT /api/admin/users/:id
router.put('/users/:id', [isAuth, isAdmin], async (req, res) => {
    const { email, role } = req.body;
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

        user.email = email || user.email;
        user.role = role || user.role;
        await user.save();
        
        res.status(200).json({ id: user.id, email: user.email, role: user.role });
    } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});

// DELETE /api/admin/users/:id - Supprimer un utilisateur (existant)
router.delete('/users/:id', [isAuth, isAdmin], async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });
        if (user.id === req.user.id) {
            return res.status(400).json({ message: "Un administrateur ne peut pas se supprimer lui-même."});
        }
        await user.destroy();
        res.status(200).json({ message: "Utilisateur supprimé." });
    } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});

module.exports = router;