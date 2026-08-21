const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const Transaction = require('../models/Transaction.model');
const Category = require('../models/Category.model');
const Budget = require('../models/Budget.model');
const { Op, fn, col, literal } = require('sequelize');
const {
    getRecurringOccurrenceDates,
    countRecurringOccurrences,
    sumRecurringExpenses,
    toDateOnlyString
} = require('../utils/recurrence');

router.get('/daily-flow/:year/:month', isAuth, async (req, res) => {
    const { year, month } = req.params;
    const userId = req.user.id;
    const currentMonth = parseInt(month, 10);
    const currentYear = parseInt(year, 10);

    const startDate = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
    const startOfNextMonth = new Date(Date.UTC(currentYear, currentMonth, 1));
    const endDate = new Date(startOfNextMonth.getTime() - 1);
    const daysInMonth = endDate.getUTCDate();

    try {
        const flowData = {
            labels: Array.from({ length: daysInMonth }, (_, i) => i + 1),
            incomeData: new Array(daysInMonth).fill(0),
            expenseData: new Array(daysInMonth).fill(0)
        };

        const oneTimeTransactions = await Transaction.findAll({ where: { UserId: userId, transactionType: 'one-time', date: { [Op.gte]: toDateOnlyString(startDate), [Op.lt]: toDateOnlyString(startOfNextMonth) } } });
        oneTimeTransactions.forEach(t => {
            const dayIndex = new Date(t.date).getUTCDate() - 1;
            if (t.type === 'income') flowData.incomeData[dayIndex] += t.amount;
            else flowData.expenseData[dayIndex] += t.amount;
        });

        const recurringTransactions = await Transaction.findAll({
            where: {
                UserId: userId,
                transactionType: 'recurring',
                startDate: { [Op.lt]: toDateOnlyString(startOfNextMonth) },
                [Op.or]: [{ endDate: { [Op.is]: null } }, { endDate: { [Op.gte]: toDateOnlyString(startDate) } }]
            }
        });

        // Toutes les fréquences (dont hebdomadaire) passent par le helper partagé, qui
        // respecte startDate/endDate au jour près et ramène une échéance qui déborde
        // du mois (le 31 en février) au dernier jour du mois.
        recurringTransactions.forEach(r => {
            getRecurringOccurrenceDates(r, startDate, endDate).forEach(occurrence => {
                const dayIndex = occurrence.getUTCDate() - 1;
                if (dayIndex < 0 || dayIndex >= daysInMonth) return;
                if (r.type === 'income') {
                    flowData.incomeData[dayIndex] += r.amount;
                } else {
                    flowData.expenseData[dayIndex] += r.amount;
                }
            });
        });

        res.status(200).json(flowData);
    } catch (error) {
        console.error("Erreur GET /daily-flow:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

router.get('/category-breakdown', isAuth, async (req, res) => {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;
    if (!startDate || !endDate) return res.status(400).json({ message: "Les dates de début et de fin sont requises." });

    const start = new Date(startDate);
    const end = new Date(endDate);

    try {
        const finalBreakdown = new Map();
        const oneTimeExpenses = await Transaction.findAll({ where: { UserId: userId, type: 'expense', transactionType: 'one-time', date: { [Op.between]: [toDateOnlyString(start), toDateOnlyString(end)] } }, include: [Category] });

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
                startDate: { [Op.lte]: toDateOnlyString(end) },
                [Op.or]: [{ endDate: { [Op.is]: null } }, { endDate: { [Op.gte]: toDateOnlyString(start) } }]
            },
            include: [Category]
        });

        recurringExpenses.forEach(r => {
            const occurrences = countRecurringOccurrences(r, start, end);

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

router.get('/income-category-breakdown', isAuth, async (req, res) => {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;
    if (!startDate || !endDate) return res.status(400).json({ message: "Les dates de début et de fin sont requises." });

    const start = new Date(startDate);
    const end = new Date(endDate);

    try {
        const finalBreakdown = new Map();
        const oneTimeIncomes = await Transaction.findAll({ where: { UserId: userId, type: 'income', transactionType: 'one-time', date: { [Op.between]: [toDateOnlyString(start), toDateOnlyString(end)] } }, include: [Category] });

        oneTimeIncomes.forEach(t => {
            t.Categories.forEach(cat => {
                if (!finalBreakdown.has(cat.name)) finalBreakdown.set(cat.name, { categoryName: cat.name, categoryColor: cat.color, totalAmount: 0, transactionCount: 0 });
                const existing = finalBreakdown.get(cat.name);
                existing.totalAmount += t.amount;
                existing.transactionCount++;
            });
        });

        const recurringIncomes = await Transaction.findAll({
            where: {
                UserId: userId, type: 'income', transactionType: 'recurring',
                startDate: { [Op.lte]: toDateOnlyString(end) },
                [Op.or]: [{ endDate: { [Op.is]: null } }, { endDate: { [Op.gte]: toDateOnlyString(start) } }]
            },
            include: [Category]
        });

        recurringIncomes.forEach(r => {
            const occurrences = countRecurringOccurrences(r, start, end);

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
        console.error("Erreur analyse par catégorie (revenus):", error);
        res.status(500).json({ message: "Erreur serveur lors de l'analyse." });
    }
});

router.get('/budget-history', isAuth, async (req, res) => {
    const userId = req.user.id;
    try {
        // Obtenir la date actuelle pour filtrer les budgets futurs
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 0-indexed to 1-indexed

        // 1. Récupérer tous les budgets de l'utilisateur avec leur catégorie (exclure les mois futurs)
        const allBudgets = await Budget.findAll({
            where: {
                UserId: userId,
                [Op.or]: [
                    { year: { [Op.lt]: currentYear } },
                    {
                        year: currentYear,
                        month: { [Op.lte]: currentMonth }
                    }
                ]
            },
            include: {
                model: Category,
                attributes: ['name', 'color'],
                where: { isTrackedMonthly: true }
            },
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
                const startDate = new Date(Date.UTC(year, month - 1, 1));
                const endDate = new Date(Date.UTC(year, month, 0));

                // Dépenses ponctuelles
                const oneTimeExpenses = await Transaction.sum('amount', {
                    where: {
                        UserId: userId,
                        type: 'expense',
                        transactionType: 'one-time',
                        date: { [Op.between]: [toDateOnlyString(startDate), toDateOnlyString(endDate)] },
                    },
                    include: [{ model: Category, where: { id: categoryId }, attributes: [] }]
                });

                // Dépenses récurrentes
                const recurringExpenses = await Transaction.findAll({
                    where: {
                        UserId: userId,
                        type: 'expense',
                        transactionType: 'recurring',
                        startDate: { [Op.lte]: toDateOnlyString(endDate) },
                        [Op.or]: [{ endDate: { [Op.is]: null } }, { endDate: { [Op.gte]: toDateOnlyString(startDate) } }]
                    },
                    include: [{ model: Category, where: { id: categoryId } }]
                });

                const recurringTotal = sumRecurringExpenses(recurringExpenses, startDate, endDate);

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
