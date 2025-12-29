const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const Transaction = require('../models/Transaction.model');
const Category = require('../models/Category.model');
const Budget = require('../models/Budget.model');
const { Op, fn, col } = require('sequelize');
const sequelize = require('../config/database'); 

/**
 * [Conservé] Helper pour calculer le total des transactions récurrentes sur une période.
 * Essentiel pour un calcul de solde et de projection correct.
 */
/**
 * [CORRIGÉ] Helper pour calculer le total des transactions récurrentes sur une période.
 * Gère maintenant les fréquences HEBDOMADAIRES, MENSUELLES et ANNUELLES.
 */
const calculateRecurringTotals = (transactions, periodStart, periodEnd) => {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(r => {
        if (!r.startDate) return; // Ignore les récurrentes sans date de début

        let occurrences = 0;
        const tStartDate = new Date(r.startDate);
        const tEndDate = r.endDate ? new Date(r.endDate) : null;

        // On ne commence pas le calcul avant le début de la transaction ou le début de la période
        let currentDate = periodStart > tStartDate ? new Date(periodStart) : new Date(tStartDate);

        const loopEndDate = tEndDate && tEndDate < periodEnd ? tEndDate : periodEnd;

        if (r.frequency === 'weekly') {
            // Détermine le jour cible : utilise dayOfWeek si fourni, sinon dérive de startDate
            const targetDay = (r.dayOfWeek === null || r.dayOfWeek === undefined)
                ? new Date(r.startDate).getUTCDay()
                : r.dayOfWeek;

            // Avance jusqu'au premier jour de la semaine correspondant dans la période
            while (currentDate.getUTCDay() !== targetDay) {
                currentDate.setUTCDate(currentDate.getUTCDate() + 1);
                if (currentDate > loopEndDate) break;
            }

            // Compte les occurrences semaine par semaine
            while (currentDate <= loopEndDate) {
                if (currentDate >= tStartDate) occurrences++;
                currentDate.setUTCDate(currentDate.getUTCDate() + 7);
            }
        } else if (r.frequency === 'monthly' || r.frequency === 'yearly') {
            if (!r.dayOfMonth) return;
            // Itération mois par mois ou année par année
            for (let year = currentDate.getUTCFullYear(); year <= loopEndDate.getUTCFullYear(); year++) {
                const startMonth = (year === currentDate.getUTCFullYear()) ? currentDate.getUTCMonth() : 0;
                const endMonthLoop = (year === loopEndDate.getUTCFullYear()) ? loopEndDate.getUTCMonth() : 11;

                for (let month = startMonth; month <= endMonthLoop; month++) {
                    if (r.frequency === 'yearly' && month !== tStartDate.getUTCMonth()) continue;

                    const occurrenceDate = new Date(Date.UTC(year, month, r.dayOfMonth));

                    if (occurrenceDate.getUTCMonth() === month && occurrenceDate <= loopEndDate && occurrenceDate >= tStartDate) {
                        occurrences++;
                    }
                }
            }
        }

        if (occurrences > 0) {
            if (r.type === 'income') totalIncome += occurrences * r.amount;
            else totalExpense += occurrences * r.amount;
        }
    });
    return { income: totalIncome, expense: totalExpense };
};


router.get('/labels', isAuth, async (req, res) => {
    try {
        const labels = await Transaction.findAll({
            where: { UserId: req.user.id },
            attributes: [[fn('DISTINCT', col('label')), 'label']],
            order: [['label', 'ASC']],
            raw: true
        });
        res.status(200).json(labels.map(l => l.label));
    } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});

router.get('/dashboard-list', isAuth, async (req, res) => {
    const userId = req.user.id;
    try {
        const today = new Date();
        const startOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
        const startOfNextMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));
        const oneTime = await Transaction.findAll({
            where: { UserId: userId, transactionType: 'one-time', date: { [Op.gte]: startOfMonth, [Op.lt]: startOfNextMonth } },
            include: [Category]
        });
        const oneTimePlain = oneTime.map(t => t.get({ plain: true }));
        const recurring = await Transaction.findAll({
            where: {
                UserId: userId,
                transactionType: 'recurring',
                startDate: { [Op.lt]: startOfNextMonth },
                [Op.or]: [{ endDate: { [Op.is]: null } }, { endDate: { [Op.gte]: startOfMonth } }]
            },
            include: [Category]
        });
        const occurrences = [];
        recurring.forEach(r => {
            const start = new Date(r.startDate);
            const end = r.endDate ? new Date(r.endDate) : null;
            if (r.frequency === 'weekly') {
                const targetDay = r.dayOfWeek ?? new Date(r.startDate).getUTCDay();
                const first = new Date(startOfMonth);
                while (first.getUTCDay() !== targetDay) first.setUTCDate(first.getUTCDate() + 1);
                for (let d = new Date(first); d < startOfNextMonth; d.setUTCDate(d.getUTCDate() + 7)) {
                    if (d >= start && (!end || d <= end)) {
                        const plain = r.get({ plain: true });
                        occurrences.push({ ...plain, date: new Date(d) });
                    }
                }
            } else if (r.frequency === 'monthly') {
                const occ = new Date(Date.UTC(startOfMonth.getUTCFullYear(), startOfMonth.getUTCMonth(), r.dayOfMonth));
                if (occ >= start && (!end || occ <= end)) {
                    const plain = r.get({ plain: true });
                    occurrences.push({ ...plain, date: occ });
                }
            } else if (r.frequency === 'yearly') {
                const startMonth = start.getUTCMonth();
                if (startMonth === startOfMonth.getUTCMonth()) {
                    const day = r.dayOfMonth || start.getUTCDate();
                    const occ = new Date(Date.UTC(startOfMonth.getUTCFullYear(), startOfMonth.getUTCMonth(), day));
                    if (occ >= start && (!end || occ <= end)) {
                        const plain = r.get({ plain: true });
                        occurrences.push({ ...plain, date: occ });
                    }
                }
            }

        });
        const combined = [...oneTimePlain, ...occurrences].sort((a, b) => new Date(b.date) - new Date(a.date));
        res.status(200).json(combined);
    } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});

router.get('/', isAuth, async (req, res) => {
    const userId = req.user.id;
    const { year, month } = req.query;
    try {
        if (year && month) {
            const currentMonth = parseInt(month, 10);
            const currentYear = parseInt(year, 10);

            const startDateOfMonth = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
            const startOfNextMonth = new Date(Date.UTC(currentYear, currentMonth, 1));

            const oneTimeTransactions = await Transaction.findAll({
                where: { UserId: userId, transactionType: 'one-time', date: { [Op.gte]: startDateOfMonth, [Op.lt]: startOfNextMonth } },
                include: [Category]
            });

            const oneTimePlain = oneTimeTransactions.map(t => t.get({ plain: true }));
            const potentiallyRecurring = await Transaction.findAll({
                where: {
                    UserId: userId,
                    transactionType: 'recurring',
                    startDate: { [Op.lt]: startOfNextMonth },
                    [Op.or]: [{ endDate: { [Op.is]: null } }, { endDate: { [Op.gte]: startDateOfMonth } }]
                },
                include: [Category]
            });


            const recurringOccurrences = [];
            potentiallyRecurring.forEach(r => {
                const start = new Date(r.startDate);
                const end = r.endDate ? new Date(r.endDate) : null;

                if (r.frequency === 'weekly') {
                    const targetDay = r.dayOfWeek ?? new Date(r.startDate).getUTCDay();
                    const firstDay = new Date(startDateOfMonth);
                    while (firstDay.getUTCDay() !== targetDay) firstDay.setUTCDate(firstDay.getUTCDate() + 1);
                    for (let d = new Date(firstDay); d < startOfNextMonth; d.setUTCDate(d.getUTCDate() + 7)) {
                        if (d >= start && (!end || d <= end)) {
                            const plain = r.get({ plain: true });
                            recurringOccurrences.push({ ...plain, date: new Date(d) });
                        }
                    }
                } else if (r.frequency === 'monthly') {
                    const occurrence = new Date(Date.UTC(currentYear, currentMonth - 1, r.dayOfMonth));
                    if (occurrence >= start && (!end || occurrence <= end)) {
                        const plain = r.get({ plain: true });
                        recurringOccurrences.push({ ...plain, date: occurrence });
                    }
                } else if (r.frequency === 'yearly') {
                    const startMonth = start.getUTCMonth() + 1;
                    if (startMonth === currentMonth) {
                        const day = r.dayOfMonth || start.getUTCDate();
                        const occurrence = new Date(Date.UTC(currentYear, currentMonth - 1, day));
                        if (occurrence >= start && (!end || occurrence <= end)) {
                            const plain = r.get({ plain: true });
                            recurringOccurrences.push({ ...plain, date: occurrence });
                        }
                    }
                }
            });

            const allTransactions = [...oneTimePlain, ...recurringOccurrences]
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            res.status(200).json(allTransactions);
        } else {
            const transactions = await Transaction.findAll({ where: { UserId: userId, transactionType: 'one-time' }, order: [['date', 'DESC']], limit: 100, include: [Category] });
            res.status(200).json(transactions);
        }
    } catch (error) {
        console.error("Erreur GET /transactions:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des transactions." });
    }
});

router.get('/summary', isAuth, async (req, res) => {
    const userId = req.user.id;
    const today = new Date();
    const startOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const startOfNextMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));
    try {
        const oneTimeTxs = await Transaction.findAll({
            where: { UserId: userId, transactionType: 'one-time', date: { [Op.lte]: today } },
            attributes: ['type', 'amount', 'date']
        });
        const oneTimeIncomeToday = oneTimeTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const oneTimeExpenseToday = oneTimeTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const recurringTxs = await Transaction.findAll({
            where: { UserId: userId, transactionType: 'recurring', startDate: { [Op.lte]: today } }
        });
        const recurringTotalsToday = calculateRecurringTotals(recurringTxs, new Date('1970-01-01'), today);
        const currentBalance = (oneTimeIncomeToday + recurringTotalsToday.income) - (oneTimeExpenseToday + recurringTotalsToday.expense);
        const oneTimeTxsMonth = await Transaction.findAll({
            where: { UserId: userId, transactionType: 'one-time', date: { [Op.gte]: startOfMonth, [Op.lt]: startOfNextMonth } },
            attributes: ['type', 'amount', 'date']
        });
        const oneTimeIncomeMonth = oneTimeTxsMonth.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const oneTimeExpenseMonth = oneTimeTxsMonth.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const recurringTotalsMonth = calculateRecurringTotals(recurringTxs, startOfMonth, new Date(startOfNextMonth.getTime() - 1));
        const totalProjectedIncome = oneTimeIncomeMonth + recurringTotalsMonth.income;
        const totalProjectedExpense = oneTimeExpenseMonth + recurringTotalsMonth.expense;
        const oneTimeIncomeBeforeMonth = oneTimeTxs.filter(t => new Date(t.date) < startOfMonth && t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const oneTimeExpenseBeforeMonth = oneTimeTxs.filter(t => new Date(t.date) < startOfMonth && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const recurringTotalsBeforeMonth = calculateRecurringTotals(recurringTxs, new Date('1970-01-01'), new Date(startOfMonth.getTime() - 1));
        const startingBalanceOfMonth = (oneTimeIncomeBeforeMonth + recurringTotalsBeforeMonth.income) - (oneTimeExpenseBeforeMonth + recurringTotalsBeforeMonth.expense);
        const projectedBalance = startingBalanceOfMonth + totalProjectedIncome - totalProjectedExpense;

        // Calcul du solde prévisionnel avec budgets mensuels définis
        const budgets = await Budget.findAll({
            where: {
                UserId: userId,
                year: today.getUTCFullYear(),
                month: today.getUTCMonth() + 1
            },
            attributes: ['amount']
        });
        const totalBudgets = budgets.reduce((sum, budget) => sum + budget.amount, 0);
        const projectedBalanceWithBudgets = startingBalanceOfMonth + totalProjectedIncome - totalBudgets;

        res.status(200).json({
            currentBalance,
            projectedBalance,
            totalProjectedIncome,
            totalProjectedExpense,
            projectedBalanceWithBudgets,
            totalBudgets
        });
    } catch (error) {
        console.error("Erreur GET /summary:", error);
        res.status(500).json({ message: "Erreur lors du calcul du résumé." });
    }
});

router.get('/summary/:year/:month', isAuth, async (req, res) => {
    const { year, month } = req.params;
    const userId = req.user.id;
    const currentMonth = parseInt(month, 10);
    const currentYear = parseInt(year, 10);
    const startDateOfMonth = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
    const startDateOfNextMonth = new Date(Date.UTC(currentYear, currentMonth, 1));
    const startDateOfMonthStr = startDateOfMonth.toISOString().split('T')[0];
    const startDateOfNextMonthStr = startDateOfNextMonth.toISOString().split('T')[0];
    try {
        const oneTimeIncomeBefore = await Transaction.sum('amount', { where: { UserId: userId, type: 'income', transactionType: 'one-time', date: { [Op.lt]: startDateOfMonthStr } } });
        const oneTimeExpenseBefore = await Transaction.sum('amount', { where: { UserId: userId, type: 'expense', transactionType: 'one-time', date: { [Op.lt]: startDateOfMonthStr } } });
        const recurringTransactionsBefore = await Transaction.findAll({
            where: { UserId: userId, transactionType: 'recurring', startDate: { [Op.lt]: startDateOfMonthStr } }
        });
        const recurringTotalsBefore = calculateRecurringTotals(
            recurringTransactionsBefore,
            new Date('1970-01-01'),
            new Date(startDateOfMonth.getTime() - 1)
        );
        const startingBalance =
            (oneTimeIncomeBefore || 0) - (oneTimeExpenseBefore || 0) +
            (recurringTotalsBefore.income - recurringTotalsBefore.expense);
        const oneTimeIncomeMonth = await Transaction.sum('amount', { where: { UserId: userId, type: 'income', transactionType: 'one-time', date: { [Op.gte]: startDateOfMonthStr, [Op.lt]: startDateOfNextMonthStr } } });
        const oneTimeExpenseMonth = await Transaction.sum('amount', { where: { UserId: userId, type: 'expense', transactionType: 'one-time', date: { [Op.gte]: startDateOfMonthStr, [Op.lt]: startDateOfNextMonthStr } } });
        const potentiallyRecurringMonth = await Transaction.findAll({
            where: {
                UserId: userId,
                transactionType: 'recurring',
                startDate: { [Op.lt]: startDateOfNextMonthStr },
                [Op.or]: [{ endDate: { [Op.is]: null } }, { endDate: { [Op.gte]: startDateOfMonthStr } }]
            }
        });
        const recurringTotalsMonth = calculateRecurringTotals(
            potentiallyRecurringMonth,
            startDateOfMonth,
            new Date(startDateOfNextMonth.getTime() - 1)
        );
        const totalIncome = (oneTimeIncomeMonth || 0) + recurringTotalsMonth.income;
        const totalExpense = (oneTimeExpenseMonth || 0) + recurringTotalsMonth.expense;
        res.status(200).json({ startingBalance, totalIncome, totalExpense });
    } catch (error) {
        console.error("Erreur résumé mensuel:", error);
        res.status(500).json({ message: "Erreur lors du calcul du résumé mensuel." });
    }
});

router.get('/stats/expenses-by-day', isAuth, async (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
    const whereClause = { UserId: userId, type: 'expense' };
    if (startDate && endDate) {
        whereClause.date = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }
    try {
        const expensesByDay = await Transaction.findAll({
            attributes: [[fn('strftime', '%Y-%m-%d', col('date')), 'day'], [fn('sum', col('amount')), 'total']],
            where: whereClause,
            group: ['day'],
            order: [['day', 'ASC']]
        });
        res.status(200).json(expensesByDay);
    } catch (error) {
        console.error("Erreur stats:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des statistiques." });
    }
});

const sanitizeCategoryIds = async (categoryIds, userId, context = 'POST /transactions') => {
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        return [];
    }

    const normalizedIds = [...new Set(
        categoryIds
            .map(id => {
                const parsed = Number.parseInt(id, 10);
                return Number.isNaN(parsed) ? null : parsed;
            })
            .filter(id => id !== null)
    )];

    if (normalizedIds.length === 0) {
        return [];
    }

    const categories = await Category.findAll({ where: { id: normalizedIds, UserId: userId } });
    const validIds = categories.map(category => category.id);

    if (validIds.length !== normalizedIds.length) {
        const invalidIds = normalizedIds.filter(id => !validIds.includes(id));
        console.warn(`${context}: catégories invalides ignorées pour l'utilisateur ${userId}: ${invalidIds.join(', ')}`);
    }

    return validIds;
};

router.get('/stats/expenses-by-category', isAuth, async (req, res) => {
    const userId = req.user.id;
    const today = new Date();
    const startOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const startOfNextMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));
    try {
        const transactions = await Transaction.findAll({
            where: {
                UserId: userId,
                type: 'expense',
                date: { [Op.gte]: startOfMonth, [Op.lt]: startOfNextMonth }
            },
            include: [{
                model: Category,
                attributes: ['id', 'name', 'color'],
                through: { attributes: [] },
                required: true
            }]
        });

        const categoryTotals = {};
        transactions.forEach(tx => {
            const share = tx.amount / tx.Categories.length;
            tx.Categories.forEach(c => {
                if (!categoryTotals[c.id]) {
                    categoryTotals[c.id] = { categoryName: c.name, categoryColor: c.color, total: 0 };
                }
                categoryTotals[c.id].total += share;
            });
        });

        let results = Object.values(categoryTotals).sort((a, b) => b.total - a.total);
        const TOP_N = 6;
        if (results.length > TOP_N) {
            const topResults = results.slice(0, TOP_N);
            const otherResults = results.slice(TOP_N);
            const otherTotal = otherResults.reduce((sum, item) => sum + item.total, 0);
            results = [...topResults, { categoryName: 'Autres', categoryColor: '#888888', total: otherTotal }];
        }
        res.status(200).json(results);
    } catch (error) {
        console.error("Erreur stats/expenses-by-category:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des statistiques." });
    }
});

router.post('/', isAuth, async (req, res) => {
    const { label, amount, type, transactionType, date, frequency, startDate, endDate, dayOfMonth, dayOfWeek: inputDayOfWeek, categoryIds, ProjectBudgetId } = req.body;

    // --- Validation et Normalisation ---
    let processedStartDate = startDate;
    let processedDayOfWeek = inputDayOfWeek;
    if (transactionType === 'recurring') {
        if (!startDate) return res.status(400).json({ message: "La date de début est requise pour une transaction récurrente." });

        if (frequency === 'weekly' && (processedDayOfWeek === null || processedDayOfWeek === undefined)) {
            processedDayOfWeek = new Date(startDate).getUTCDay();
        }
        if ((frequency === 'monthly' || frequency === 'yearly') && !dayOfMonth) {
            return res.status(400).json({ message: "Le jour du mois (dayOfMonth) est requis pour une transaction mensuelle ou annuelle." });
        }

        // Normalise la date de début au 1er du mois pour les types mensuels/annuels
        if (frequency === 'monthly' || frequency === 'yearly') {
            const parts = startDate.split('-');
            processedStartDate = `${parts[0]}-${parts[1]}-01`;
        }
    }

    try {
        let createdTransaction;
        await sequelize.transaction(async (t) => {
            const newTransaction = await Transaction.create({
                label, amount, type, transactionType, frequency, dayOfMonth, dayOfWeek: processedDayOfWeek,
                date: date || null,
                startDate: processedStartDate,
                endDate: endDate || null,
                ProjectBudgetId: ProjectBudgetId || null,
                UserId: req.user.id
            }, { transaction: t });

            const validCategoryIds = await sanitizeCategoryIds(categoryIds, req.user.id);
            await newTransaction.setCategories(validCategoryIds, { transaction: t });

            createdTransaction = await Transaction.findByPk(newTransaction.id, { include: [Category], transaction: t });
        });
        return res.status(201).json(createdTransaction);
    } catch (error) {
        console.error("Erreur POST /transactions:", error);
        res.status(500).json({ message: "Erreur lors de la création." });
    }
});

router.put('/:id', isAuth, async (req, res) => {
    const { label, amount, type, transactionType, date, frequency, startDate, endDate, dayOfMonth, dayOfWeek: inputDayOfWeek, categoryIds, ProjectBudgetId } = req.body;

    let processedStartDate = startDate;
    let processedDayOfWeek = inputDayOfWeek;
    if (transactionType === 'recurring') {
        if (!startDate) return res.status(400).json({ message: "La date de début est requise pour une transaction récurrente." });
        if (frequency === 'weekly' && (processedDayOfWeek === null || processedDayOfWeek === undefined)) processedDayOfWeek = new Date(startDate).getUTCDay();
        if ((frequency === 'monthly' || frequency === 'yearly') && !dayOfMonth) return res.status(400).json({ message: "Le jour du mois (dayOfMonth) est requis." });

        if (frequency === 'monthly' || frequency === 'yearly') {
            const parts = startDate.split('-');
            processedStartDate = `${parts[0]}-${parts[1]}-01`;
        }
    }

    try {
        let updatedTransaction;
        await sequelize.transaction(async (t) => {
            const transaction = await Transaction.findOne({ where: { id: req.params.id, UserId: req.user.id }, transaction: t });
            if (!transaction) {
                const error = new Error('TRANSACTION_NOT_FOUND');
                error.statusCode = 404;
                throw error;
            }

            await transaction.update({
                label, amount, type, transactionType, frequency, dayOfMonth, dayOfWeek: processedDayOfWeek,
                date: date || null,
                startDate: processedStartDate,
                endDate: endDate || null,
                ProjectBudgetId
            }, { transaction: t });

            if (categoryIds !== undefined) {
                const validCategoryIds = await sanitizeCategoryIds(categoryIds, req.user.id, 'PUT /transactions');
                await transaction.setCategories(validCategoryIds, { transaction: t });
            }

            updatedTransaction = await Transaction.findByPk(req.params.id, { include: [Category], transaction: t });
        });

        if (!updatedTransaction) {
            return res.status(404).json({ message: "Transaction non trouvée." });
        }

        return res.status(200).json(updatedTransaction);
    } catch (error) {
        if (error?.statusCode === 404 || error?.message === 'TRANSACTION_NOT_FOUND') {
            return res.status(404).json({ message: "Transaction non trouvée." });
        }
        console.error("Erreur PUT /transactions:", error);
        res.status(500).json({ message: 'Erreur lors de la modification.' });
    }
});

router.delete('/:id', isAuth, async (req, res) => {
    const transactionId = req.params.id;
    const userId = req.user.id;
    try {
        const transaction = await Transaction.findOne({ where: { id: transactionId, UserId: userId } });
        if (!transaction) return res.status(404).json({ message: "Transaction non trouvée." });
        await transaction.destroy();
        res.status(200).json({ message: 'Transaction supprimée avec succès.' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression de la transaction.' });
    }
});

module.exports = router;