const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const ProjectBudget = require('../models/ProjectBudget.model');
const Transaction = require('../models/Transaction.model');

// GET /api/project-budgets - Lister tous les budgets de projet
router.get('/', isAuth, async (req, res) => {
    try {
        const budgets = await ProjectBudget.findAll({ where: { UserId: req.user.id }, order: [['startDate', 'DESC']] });
        // Pour chaque budget, on calcule le total déjà dépensé
        const budgetsWithSpent = await Promise.all(budgets.map(async (budget) => {
            const spent = await Transaction.sum('amount', {
                where: { ProjectBudgetId: budget.id, type: 'expense' }
            });
            return { ...budget.toJSON(), spentAmount: spent || 0 };
        }));
        res.status(200).json(budgetsWithSpent);
    } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});

// POST /api/project-budgets - Créer un budget de projet
router.post('/', isAuth, async (req, res) => {
    const { name, totalAmount, startDate, endDate } = req.body;
    try {
        const newBudget = await ProjectBudget.create({ name, totalAmount, startDate, endDate, UserId: req.user.id });
        res.status(201).json(newBudget);
    } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});

router.put('/:id', isAuth, async (req, res) => {
    try {
        const budget = await ProjectBudget.findOne({ where: { id: req.params.id, UserId: req.user.id } });
        if (!budget) return res.status(404).json({ message: "Budget non trouvé." });
        
        await budget.update(req.body);
        res.status(200).json(budget);
    } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});


router.delete('/:id', isAuth, async (req, res) => {
    try {
        const budget = await ProjectBudget.findOne({ where: { id: req.params.id, UserId: req.user.id } });
        if (!budget) return res.status(404).json({ message: "Budget non trouvé." });

        await budget.destroy();
        res.status(200).json({ message: "Budget supprimé." });
    } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});

module.exports = router;