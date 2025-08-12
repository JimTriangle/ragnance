const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const Category = require('../models/Category.model');

// GET /api/categories - Lister les catégories de l'utilisateur
router.get('/', isAuth, async (req, res) => {
    const { isTracked } = req.query;
    const whereClause = { UserId: req.user.id };
    if (isTracked === 'true') {
        whereClause.isTrackedMonthly = true;
    }
    try {
        const categories = await Category.findAll({ 
            where: whereClause,
            order: [['name', 'ASC']]
        });
        res.status(200).json(categories);
    } catch (error) { 
        res.status(500).json({ message: "Erreur serveur" }); 
    }
});

// POST /api/categories - Créer une catégorie
router.post('/', isAuth, async (req, res) => {
    const { name, color, isTrackedMonthly } = req.body;
    try {
        const newCategory = await Category.create({ name, color, isTrackedMonthly, UserId: req.user.id });
        res.status(201).json(newCategory);
    } catch (error) { 
        res.status(500).json({ message: "Erreur serveur" }); 
    }
});

// ON AJOUTE CETTE ROUTE POUR LA MODIFICATION
// PUT /api/categories/:id
router.put('/:id', isAuth, async (req, res) => {
    try {
        const category = await Category.findOne({ where: { id: req.params.id, UserId: req.user.id } });
        if (!category) {
            return res.status(404).json({ message: "Catégorie non trouvée." });
        }
        const updatedCategory = await category.update(req.body);
        res.status(200).json(updatedCategory);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
});


// DELETE /api/categories/:id - Supprimer une catégorie
router.delete('/:id', isAuth, async (req, res) => {
    try {
        const category = await Category.findOne({ where: { id: req.params.id, UserId: req.user.id } });
        if (!category) {
            return res.status(404).json({ message: "Catégorie non trouvée." });
        }
        await category.destroy();
        res.status(200).json({ message: "Catégorie supprimée." });
    } catch (error) { 
        res.status(500).json({ message: "Erreur serveur" }); 
    }
});

module.exports = router;