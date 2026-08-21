const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const Budget = require('../models/Budget.model');
const Category = require('../models/Category.model');
const Transaction = require('../models/Transaction.model');
const { Op } = require('sequelize');

// Helper partagé : voir server/utils/recurrence.js
const { sumRecurringExpenses: calculateRecurringExpenses, toDateOnlyString } = require('../utils/recurrence');

router.get('/progress/:year/:month', isAuth, async (req, res) => {
    const { year, month } = req.params;
    const userId = req.user.id;
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const startOfNextMonth = new Date(Date.UTC(year, month, 1));

    try {
        const budgets = await Budget.findAll({
            where: {
                UserId: userId,
                year: parseInt(year),
                month: parseInt(month)
            },
            include: [{ model: Category, attributes: ['name', 'color'] }]
        });

        const progressData = await Promise.all(budgets.map(async (budget) => {
            const oneTimeSpent = await Transaction.sum('amount', {
                where: {
                    UserId: userId,
                    type: 'expense',
                    transactionType: 'one-time',
                    date: { [Op.gte]: toDateOnlyString(startDate), [Op.lt]: toDateOnlyString(startOfNextMonth) }
                },
                include: [{
                    model: Category,
                    where: { id: budget.CategoryId },
                    attributes: [],
                    required: true
                }]
            });

            const recurringExpenses = await Transaction.findAll({
                where: {
                    UserId: userId,
                    type: 'expense',
                    transactionType: 'recurring',
                    startDate: { [Op.lt]: toDateOnlyString(startOfNextMonth) },
                    [Op.or]: [{ endDate: { [Op.is]: null } }, { endDate: { [Op.gte]: toDateOnlyString(startDate) } }]
                },
                include: [{
                    model: Category,
                    where: { id: budget.CategoryId },
                    attributes: [],
                    required: true
                }]
            });

            const recurringTotal = calculateRecurringExpenses(recurringExpenses, startDate, new Date(startOfNextMonth.getTime() - 1));

            return {
                categoryId: budget.CategoryId,
                categoryName: budget.Category.name,
                categoryColor: budget.Category.color,
                budgetedAmount: budget.amount,
                spentAmount: (oneTimeSpent || 0) + recurringTotal,
            };
        }));

        res.status(200).json(progressData);

    } catch (error) {
        res.status(500).json({ message: "Erreur serveur" });
    }
});

router.get('/:year/:month', isAuth, async (req, res) => {
    const { year, month } = req.params;
    try {
        const budgets = await Budget.findAll({
            where: {
                UserId: req.user.id,
                year: parseInt(year),
                month: parseInt(month)
            },
            include: [Category]
        });
        res.status(200).json(budgets);
    } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});

router.post('/', isAuth, async (req, res) => {
    const { amount, year, month, CategoryId } = req.body;
    try {
        const [budget, created] = await Budget.findOrCreate({
            where: {
                UserId: req.user.id,
                year: parseInt(year),
                month: parseInt(month),
                CategoryId: CategoryId
            },
            defaults: { amount: amount }
        });
        if (!created) {
            await budget.update({ amount });
        }
        res.status(200).json(budget);
    } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});

// Copier les budgets d'un mois vers un autre
router.post('/copy', isAuth, async (req, res) => {
    const { fromYear, fromMonth, toYear, toMonth } = req.body;
    try {
        // Récupérer les budgets du mois source
        const sourceBudgets = await Budget.findAll({
            where: {
                UserId: req.user.id,
                year: parseInt(fromYear),
                month: parseInt(fromMonth)
            }
        });

        if (sourceBudgets.length === 0) {
            return res.status(404).json({ message: "Aucun budget trouvé pour le mois source" });
        }

        // Créer ou mettre à jour les budgets pour le mois destination
        const copiedBudgets = [];
        for (const sourceBudget of sourceBudgets) {
            const [budget, created] = await Budget.findOrCreate({
                where: {
                    UserId: req.user.id,
                    year: parseInt(toYear),
                    month: parseInt(toMonth),
                    CategoryId: sourceBudget.CategoryId
                },
                defaults: { amount: sourceBudget.amount }
            });

            if (!created) {
                await budget.update({ amount: sourceBudget.amount });
            }

            copiedBudgets.push(budget);
        }

        res.status(200).json({
            message: `${copiedBudgets.length} budget(s) copié(s) avec succès`,
            budgets: copiedBudgets
        });
    } catch (error) {
        console.error("Erreur lors de la copie des budgets:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

module.exports = router;