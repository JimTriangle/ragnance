const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const Transaction = require('../models/Transaction.model');
const Category = require('../models/Category.model');
const Budget = require('../models/Budget.model');
const { Op, fn, col, literal } = require('sequelize');

router.get('/daily-flow/:year/:month', isAuth, async (req, res) => {
    const { year, month } = req.params;
    const userId = req.user.id;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const daysInMonth = new Date(year, month, 0).getDate();
    try {
        const flowData = {
            labels: Array.from({ length: daysInMonth }, (_, i) => i + 1),
            incomeData: new Array(daysInMonth).fill(0),
            expenseData: new Array(daysInMonth).fill(0)
        };
        const oneTimeTransactions = await Transaction.findAll({ where: { UserId: userId, transactionType: 'one-time', date: { [Op.between]: [startDate, endDate] } } });
        oneTimeTransactions.forEach(t => {
            const dayIndex = new Date(t.date).getUTCDate() - 1;
            if (t.type === 'income') flowData.incomeData[dayIndex] += t.amount;
            else flowData.expenseData[dayIndex] += t.amount;
        });
        const recurringTransactions = await Transaction.findAll({
            where: {
                UserId: userId, transactionType: 'recurring', startDate: { [Op.lte]: endDate },
                [Op.or]: [{ endDate: { [Op.is]: null } }, { endDate: { [Op.gte]: startDate } }]
            }
        });
        recurringTransactions.forEach(r => {
            if (r.dayOfMonth >= 1 && r.dayOfMonth <= daysInMonth) {
                const dayIndex = r.dayOfMonth - 1;
                if (r.type === 'income') flowData.incomeData[dayIndex] += r.amount;
                else flowData.expenseData[dayIndex] += r.amount;
            }
        });
        res.status(200).json(flowData);
    } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});

router.get('/category-breakdown', isAuth, async (req, res) => {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;
    if (!startDate || !endDate) return res.status(400).json({ message: "Les dates de début et de fin sont requises." });

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    try {
        const finalBreakdown = new Map();

        const oneTimeExpenses = await Transaction.findAll({
            where: { UserId: userId, type: 'expense', transactionType: 'one-time', date: { [Op.between]: [start, end] } },
            include: [Category]
        });

        oneTimeExpenses.forEach(t => {
            t.Categories.forEach(cat => {
                if (!finalBreakdown.has(cat.name)) finalBreakdown.set(cat.name, { categoryName: cat.name, categoryColor: cat.color, totalAmount: 0, transactionCount: 0 });
                const existing = finalBreakdown.get(cat.name);
                existing.totalAmount += t.amount;
                existing.transactionCount++;
            });
        });

        const recurringExpenses = await Transaction.findAll({
            where: {
                UserId: userId, type: 'expense', transactionType: 'recurring',
                startDate: { [Op.lte]: end },
                [Op.or]: [{ endDate: { [Op.is]: null } }, { endDate: { [Op.gte]: start } }]
            },
            include: [Category]
        });

        recurringExpenses.forEach(r => {
            if (!r.dayOfMonth) return;
            let occurrences = 0;
            let current = new Date(r.startDate);
            while (current <= end) {
                if (current >= start) {
                    occurrences++;
                }
                current.setMonth(current.getMonth() + 1);
            }

            if (occurrences > 0) {
                const recurringTotal = occurrences * r.amount;
                r.Categories.forEach(cat => {
                    if (!finalBreakdown.has(cat.name)) finalBreakdown.set(cat.name, { categoryName: cat.name, categoryColor: cat.color, totalAmount: 0, transactionCount: 0 });
                    const existing = finalBreakdown.get(cat.name);
                    existing.totalAmount += recurringTotal;
                    existing.transactionCount += occurrences;
                });
            }
        });

        const results = Array.from(finalBreakdown.values()).sort((a, b) => b.totalAmount - a.totalAmount);
        res.status(200).json(results);
    } catch (error) {
        console.error("Erreur analyse par catégorie:", error);
        res.status(500).json({ message: "Erreur serveur lors de l'analyse." });
    }
});

router.get('/budget-history', isAuth, async (req, res) => {
    const userId = req.user.id;
    try {
        // 1. Récupérer tous les budgets de l'utilisateur avec leur catégorie
        const allBudgets = await Budget.findAll({
            where: { UserId: userId },
            include: { model: Category, attributes: ['name', 'color'] },
            order: [['year', 'ASC'], ['month', 'ASC']]
        });

        // 2. Regrouper les budgets par catégorie
        const budgetsByCategory = allBudgets.reduce((acc, budget) => {
            if (!acc[budget.CategoryId]) {
                acc[budget.CategoryId] = {
                    info: {
                        id: budget.CategoryId,
                        name: budget.Category.name,
                        color: budget.Category.color
                    },
                    history: []
                };
            }
            acc[budget.CategoryId].history.push({
                year: budget.year,
                month: budget.month,
                budgeted: budget.amount,
                spent: 0 // On initialise les dépenses à 0
            });
            return acc;
        }, {});

        // 3. Calculer les dépenses pour chaque budget
        for (const categoryId in budgetsByCategory) {
            for (const historyItem of budgetsByCategory[categoryId].history) {
                const { year, month } = historyItem;
                const startDate = new Date(year, month - 1, 1);
                const endDate = new Date(year, month, 0, 23, 59, 59);

                // Dépenses ponctuelles
                const oneTimeExpenses = await Transaction.sum('amount', {
                    where: {
                        UserId: userId,
                        type: 'expense',
                        transactionType: 'one-time',
                        date: { [Op.between]: [startDate, endDate] },
                    },
                    include: [{ model: Category, where: { id: categoryId }, attributes: [] }]
                });

                // Dépenses récurrentes
                const recurringExpenses = await Transaction.findAll({
                    where: {
                        UserId: userId,
                        type: 'expense',
                        transactionType: 'recurring',
                        startDate: { [Op.lte]: endDate },
                        [Op.or]: [{ endDate: { [Op.is]: null } }, { endDate: { [Op.gte]: startDate } }]
                    },
                    include: [{ model: Category, where: { id: categoryId } }]
                });

                // Les transactions récurrentes comptent pour chaque mois où elles sont actives
                const recurringTotal = recurringExpenses.reduce((sum, t) => sum + t.amount, 0);

                historyItem.spent = (oneTimeExpenses || 0) + recurringTotal;
            }
        }

        // 4. Générer les suggestions
        const suggestions = [];
        for (const categoryId in budgetsByCategory) {
            const { info, history } = budgetsByCategory[categoryId];

            // On ne garde que les 6 derniers mois pertinents pour les suggestions
            const recentHistory = history.slice(-6);
            if (recentHistory.length < 3) continue; // Pas assez de données pour une suggestion fiable

            const overspentMonths = recentHistory.filter(h => h.spent > h.budgeted).length;
            const underspentMonths = recentHistory.filter(h => h.spent < h.budgeted * 0.7).length;

            if (overspentMonths >= 3) {
                const avgSpent = recentHistory.reduce((sum, h) => sum + h.spent, 0) / recentHistory.length;
                const suggestedBudget = Math.ceil(avgSpent / 10) * 10; // Arrondi à la dizaine supérieure
                suggestions.push({
                    type: 'increase',
                    categoryName: info.name,
                    categoryId: info.id,
                    currentBudget: recentHistory[recentHistory.length - 1].budgeted,
                    suggestedBudget: suggestedBudget,
                    reason: `Vous avez dépassé le budget ${overspentMonths} fois sur les ${recentHistory.length} derniers mois.`
                });
            } else if (underspentMonths >= 4) {
                const avgSpent = recentHistory.reduce((sum, h) => sum + h.spent, 0) / recentHistory.length;
                const suggestedBudget = Math.floor(avgSpent / 10) * 10; // Arrondi à la dizaine inférieure
                suggestions.push({
                    type: 'decrease',
                    categoryName: info.name,
                    categoryId: info.id,
                    currentBudget: recentHistory[recentHistory.length - 1].budgeted,
                    suggestedBudget: suggestedBudget,
                    reason: `Vos dépenses sont régulièrement inférieures au budget défini.`
                });
            }
        }

        res.status(200).json({
            analysis: Object.values(budgetsByCategory),
            suggestions
        });

    } catch (error) {
        console.error("Erreur lors de l'analyse de l'historique des budgets:", error);
        res.status(500).json({ message: "Erreur serveur lors de l'analyse." });
    }
});

module.exports = router;
