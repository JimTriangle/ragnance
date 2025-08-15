const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const isAuth = require('../middleware/isAuth');
const isAdmin = require('../middleware/isAdmin');
const User = require('../models/User.model');
const sequelize = require('../config/database');


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
    const { email, password, role, budgetAccess, tradingAccess } = req.body;
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
        const newUser = await User.create({ email, password: hashedPassword, role, budgetAccess, tradingAccess });
        res.status(201).json({ id: newUser.id, email: newUser.email, role: newUser.role, budgetAccess: newUser.budgetAccess, tradingAccess: newUser.tradingAccess });
    } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});

// --- NOUVELLE ROUTE : MODIFIER UN UTILISATEUR ---
// PUT /api/admin/users/:id
router.put('/users/:id', [isAuth, isAdmin], async (req, res) => {
    const { email, role, budgetAccess, tradingAccess } = req.body;
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

        user.email = email || user.email;
        user.role = role || user.role;
        if (budgetAccess !== undefined) user.budgetAccess = budgetAccess;
        if (tradingAccess !== undefined) user.tradingAccess = tradingAccess;
        await user.save();

        res.status(200).json({ id: user.id, email: user.email, role: user.role, budgetAccess: user.budgetAccess, tradingAccess: user.tradingAccess });
    } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});

// DELETE /api/admin/users/:id - Supprimer un utilisateur (existant)
router.delete('/users/:id', [isAuth, isAdmin], async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });
        if (user.id === req.user.id) {
            return res.status(400).json({ message: "Un administrateur ne peut pas se supprimer lui-même." });
        }
        await user.destroy();
        res.status(200).json({ message: "Utilisateur supprimé." });
    } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});


router.get('/schema', [isAuth, isAdmin], async (req, res) => {
    try {
        const tableName = req.query.table;

        if (tableName) {
            const [columns] = await sequelize.query(`PRAGMA table_info(${tableName})`);
            return res.status(200).json({
                name: tableName,
                columns: columns.map(col => ({ name: col.name, type: col.type }))
            });
        }
        const [tables] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
        res.status(200).json(tables.map(t => t.name));
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération du schéma" });
    }
});

// --- ROUTE : Exécuter une requête SQL arbitraire ---
router.post('/sql', [isAuth, isAdmin], async (req, res) => {
    const { query } = req.body;
    if (!query) {
        return res.status(400).json({ message: "Requête SQL manquante" });
    }
    try {
        const [results] = await sequelize.query(query);
        res.status(200).json({ results });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;