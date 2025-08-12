const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const Budget = require('../models/Budget.model');
const Category = require('../models/Category.model');
const Transaction = require('../models/Transaction.model');
const { Op } = require('sequelize');

router.get('/progress/:year/:month', isAuth, async (req, res) => {
    const { year, month } = req.params;
    const userId = req.user.id;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

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
            const totalSpent = await Transaction.sum('amount', {
                where: {
                    UserId: userId,
                    type: 'expense',
                    // On ne prend que les transactions ponctuelles pour ce calcul
                    transactionType: 'one-time',
                    date: { [Op.between]: [startDate, endDate] }
                },
                include: [{
                    model: Category,
                    where: { id: budget.CategoryId },
                    attributes: [],
                    required: true // Garder pour ne sommer que pour la bonne catégorie
                }]
            });

            return {
                categoryId: budget.CategoryId,
                categoryName: budget.Category.name,
                categoryColor: budget.Category.color,
                budgetedAmount: budget.amount,
                spentAmount: totalSpent || 0,
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
                year: year,
                month: month,
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

module.exports = router;