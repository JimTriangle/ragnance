const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const Transaction = require('../models/Transaction.model');
const Category = require('../models/Category.model');
const ProjectBudget = require('../models/ProjectBudget.model');
const { Op, fn, col } = require('sequelize');

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
        const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
        const oneTime = await Transaction.findAll({
            where: { UserId: userId, transactionType: 'one-time', date: { [Op.gte]: thirtyDaysAgo } },
            include: [Category]
        });
        const recurring = await Transaction.findAll({
            where: {
                UserId: userId, transactionType: 'recurring', startDate: { [Op.lte]: new Date() },
                [Op.or]: [{ endDate: { [Op.is]: null } }, { endDate: { [Op.gte]: new Date() } }]
            },
            include: [Category]
        });
        const nextOccurrences = recurring.map(r => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let nextDate = new Date(r.startDate);
            if (r.frequency === 'monthly') {
                while (nextDate < today) {
                    nextDate.setMonth(nextDate.getMonth() + 1);
                }
            } else if (r.frequency === 'yearly') {
                while (nextDate < today) {
                    nextDate.setFullYear(nextDate.getFullYear() + 1);
                }
            }
            const plainObject = r.get({ plain: true });
            return { ...plainObject, date: nextDate };
        });
        const combined = [...oneTime, ...nextOccurrences].sort((a, b) => new Date(b.date) - new Date(a.date));
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

            const potentiallyRecurring = await Transaction.findAll({
                where: {
                    UserId: userId, transactionType: 'recurring', startDate: { [Op.lt]: startOfNextMonth },
                    [Op.or]: [{ endDate: { [Op.is]: null } }, { endDate: { [Op.gte]: startDateOfMonth } }]
                },
                include: [Category]
            });

            const recurringTransactionsForMonth = potentiallyRecurring.filter(r => {
                const transactionStartDate = new Date(r.startDate);
                if (r.frequency === 'monthly') return true;
                if (r.frequency === 'yearly') {
                    const transactionStartMonth = transactionStartDate.getUTCMonth() + 1;
                    return transactionStartMonth === currentMonth;
                }
                return false;
            });

            const allTransactions = [...oneTimeTransactions, ...recurringTransactionsForMonth]
                .sort((a, b) => {
                    const dateA = a.date ? new Date(a.date) : new Date(Date.UTC(currentYear, currentMonth - 1, a.dayOfMonth || 1));
                    const dateB = b.date ? new Date(b.date) : new Date(Date.UTC(currentYear, currentMonth - 1, b.dayOfMonth || 1));
                    return dateB - dateA;
                });
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
        res.status(200).json({ currentBalance, projectedBalance, totalProjectedIncome, totalProjectedExpense });
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
        let startingBalance = (oneTimeIncomeBefore || 0) - (oneTimeExpenseBefore || 0);
        const recurringTransactionsBefore = await Transaction.findAll({
            where: { UserId: userId, transactionType: 'recurring', startDate: { [Op.lt]: startDateOfMonthStr } }
        });
        recurringTransactionsBefore.forEach(r => {
            let occurrences = 0;
            const transactionStartDate = new Date(r.startDate);
            const finalEndDate = r.endDate ? new Date(r.endDate) : new Date(startDateOfMonthStr);
            let currentDate = new Date(transactionStartDate);
            while (currentDate < new Date(startDateOfMonthStr) && currentDate <= finalEndDate) {
                occurrences++;
                if (r.frequency === 'monthly') currentDate.setMonth(currentDate.getMonth() + 1);
                else if (r.frequency === 'yearly') currentDate.setFullYear(currentDate.getFullYear() + 1);
                else break;
            }
            if (r.type === 'income') startingBalance += occurrences * r.amount;
            else startingBalance -= occurrences * r.amount;
        });
        const oneTimeIncomeMonth = await Transaction.sum('amount', { where: { UserId: userId, type: 'income', transactionType: 'one-time', date: { [Op.gte]: startDateOfMonthStr, [Op.lt]: startDateOfNextMonthStr } } });
        const oneTimeExpenseMonth = await Transaction.sum('amount', { where: { UserId: userId, type: 'expense', transactionType: 'one-time', date: { [Op.gte]: startDateOfMonthStr, [Op.lt]: startDateOfNextMonthStr } } });
        const potentiallyRecurringMonth = await Transaction.findAll({
            where: { UserId: userId, transactionType: 'recurring', startDate: { [Op.lt]: startDateOfNextMonthStr },
            [Op.or]: [{ endDate: { [Op.is]: null } }, { endDate: { [Op.gte]: startDateOfMonthStr } }] }
        });
        let recurringIncomeMonth = 0;
        let recurringExpenseMonth = 0;
        potentiallyRecurringMonth.forEach(r => {
            const transactionStartDate = new Date(r.startDate);
            let appliesThisMonth = false;
            if (r.frequency === 'monthly') appliesThisMonth = true;
            else if (r.frequency === 'yearly') {
                const transactionStartMonth = transactionStartDate.getUTCMonth() + 1;
                if (transactionStartMonth === currentMonth) appliesThisMonth = true;
            }
            if (appliesThisMonth) {
                if (r.type === 'income') recurringIncomeMonth += r.amount;
                else recurringExpenseMonth += r.amount;
            }
        });
        const totalIncome = (oneTimeIncomeMonth || 0) + recurringIncomeMonth;
        const totalExpense = (oneTimeExpenseMonth || 0) + recurringExpenseMonth;
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

router.get('/stats/expenses-by-category', isAuth, async (req, res) => {
    const userId = req.user.id;
    try {
        const results = await Transaction.findAll({
            attributes: [[col('Categories.name'), 'categoryName'], [col('Categories.color'), 'categoryColor'], [fn('sum', col('Transaction.amount')), 'total']],
            include: [{ model: Category, attributes: [], required: true }],
            where: { UserId: userId, type: 'expense' },
            group: ['Categories.id', 'Categories.name', 'Categories.color'],
            order: [[fn('sum', col('Transaction.amount')), 'DESC']],
            raw: true
        });
        const TOP_N = 6;
        let finalResults = results;
        if (results.length > TOP_N) {
            const topResults = results.slice(0, TOP_N);
            const otherResults = results.slice(TOP_N);
            const otherTotal = otherResults.reduce((sum, item) => sum + item.total, 0);
            finalResults = [...topResults, { categoryName: 'Autres', categoryColor: '#888888', total: otherTotal }];
        }
        res.status(200).json(finalResults);
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
        const newTransaction = await Transaction.create({
            label, amount, type, transactionType, frequency, dayOfMonth, dayOfWeek: processedDayOfWeek,
            date: date || null,
            startDate: processedStartDate,
            endDate: endDate || null,
            ProjectBudgetId: ProjectBudgetId || null,
            UserId: req.user.id
        });
        if (categoryIds && categoryIds.length > 0) await newTransaction.setCategories(categoryIds);
        const result = await Transaction.findByPk(newTransaction.id, { include: [Category] });
        res.status(201).json(result);
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
        const transaction = await Transaction.findOne({ where: { id: req.params.id, UserId: req.user.id } });
        if (!transaction) return res.status(404).json({ message: "Transaction non trouvée." });

        await transaction.update({
            label, amount, type, transactionType, frequency, dayOfMonth, dayOfWeek: processedDayOfWeek,
            date: date || null,
            startDate: processedStartDate,
            endDate: endDate || null,
            ProjectBudgetId
        });

        if (categoryIds) await transaction.setCategories(categoryIds);
        const updatedTransaction = await Transaction.findByPk(req.params.id, { include: [Category] });
        res.status(200).json(updatedTransaction);
    } catch (error) {
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