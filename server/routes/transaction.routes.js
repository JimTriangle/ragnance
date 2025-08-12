const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const Transaction = require('../models/Transaction.model');
const Category = require('../models/Category.model');
const ProjectBudget = require('../models/ProjectBudget.model');
const { Op, fn, col } = require('sequelize');

router.get('/labels', isAuth, async (req, res) => {
    try {
        const labels = await Transaction.findAll({
            where: { UserId: req.user.id },
            attributes: [ [fn('DISTINCT', col('label')), 'label'] ],
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
        
        // CORRECTION : On ajoute "include: [Category]" ici
        const oneTime = await Transaction.findAll({
            where: { UserId: userId, transactionType: 'one-time', date: { [Op.gte]: thirtyDaysAgo } },
            include: [Category]
        });

        // CORRECTION : On ajoute "include: [Category]" ici aussi
        const recurring = await Transaction.findAll({
            where: {
                UserId: userId, transactionType: 'recurring', startDate: { [Op.lte]: new Date() },
                [Op.or]: [{ endDate: { [Op.is]: null } }, { endDate: { [Op.gte]: new Date() } }]
            },
            include: [Category]
        });

        const nextOccurrences = recurring.map(r => {
            const today = new Date();
            let nextDate = new Date(r.startDate);
            if (r.frequency === 'monthly') {
                while (nextDate < today) {
                    nextDate.setMonth(nextDate.getMonth() + 1);
                }
            }
            // CORRECTION : On utilise .get({ plain: true }) pour conserver les associations
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
            const startDateOfMonth = new Date(year, month - 1, 1);
            const endDateOfMonth = new Date(year, month, 0, 23, 59, 59);
            const oneTimeTransactions = await Transaction.findAll({ where: { UserId: userId, transactionType: 'one-time', date: { [Op.between]: [startDateOfMonth, endDateOfMonth] } }, include: [Category] });
            const recurringTransactions = await Transaction.findAll({
                where: {
                    UserId: userId, transactionType: 'recurring', startDate: { [Op.lte]: endDateOfMonth },
                    [Op.or]: [{ endDate: { [Op.is]: null } }, { endDate: { [Op.gte]: startDateOfMonth } }]
                },
                include: [Category]
            });
            const allTransactions = [...oneTimeTransactions, ...recurringTransactions]
                .sort((a, b) => {
                    const dateA = a.date ? new Date(a.date) : new Date(year, month - 1, a.dayOfMonth || 1);
                    const dateB = b.date ? new Date(b.date) : new Date(year, month - 1, b.dayOfMonth || 1);
                    return dateB - dateA;
                });
            res.status(200).json(allTransactions);
        } else {
            const transactions = await Transaction.findAll({ where: { UserId: userId, transactionType: 'one-time' }, order: [['date', 'DESC']], limit: 100, include: [Category] });
            res.status(200).json(transactions);
        }
    } catch (error) { res.status(500).json({ message: "Erreur lors de la récupération des transactions." }); }
});

router.get('/summary', isAuth, async (req, res) => {
    const userId = req.user.id;
    try {
        const oneTimeIncomeTotal = await Transaction.sum('amount', { where: { UserId: userId, type: 'income', transactionType: 'one-time', date: { [Op.lte]: new Date() } } });
        const oneTimeExpenseTotal = await Transaction.sum('amount', { where: { UserId: userId, type: 'expense', transactionType: 'one-time', date: { [Op.lte]: new Date() } } });
        const currentBalance = (oneTimeIncomeTotal || 0) - (oneTimeExpenseTotal || 0);
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const incomeBeforeMonth = await Transaction.sum('amount', { where: { UserId: userId, type: 'income', transactionType: 'one-time', date: { [Op.lt]: startOfMonth } } });
        const expenseBeforeMonth = await Transaction.sum('amount', { where: { UserId: userId, type: 'expense', transactionType: 'one-time', date: { [Op.lt]: startOfMonth } } });
        const startingBalanceOfMonth = (incomeBeforeMonth || 0) - (expenseBeforeMonth || 0);
        const oneTimeIncomeMonth = await Transaction.sum('amount', { where: { UserId: userId, type: 'income', transactionType: 'one-time', date: { [Op.between]: [startOfMonth, endOfMonth] } } });
        const recurringIncome = await Transaction.sum('amount', { where: { UserId: userId, type: 'income', transactionType: 'recurring', startDate: { [Op.lte]: endOfMonth }, [Op.or]: [{ endDate: { [Op.is]: null } }, { endDate: { [Op.gte]: startOfMonth } }] } });
        const totalProjectedIncome = (oneTimeIncomeMonth || 0) + (recurringIncome || 0);
        const oneTimeExpenseMonth = await Transaction.sum('amount', { where: { UserId: userId, type: 'expense', transactionType: 'one-time', date: { [Op.between]: [startOfMonth, endOfMonth] } } });
        const recurringExpense = await Transaction.sum('amount', { where: { UserId: userId, type: 'expense', transactionType: 'recurring', startDate: { [Op.lte]: endOfMonth }, [Op.or]: [{ endDate: { [Op.is]: null } }, { endDate: { [Op.gte]: startOfMonth } }] } });
        const totalProjectedExpense = (oneTimeExpenseMonth || 0) + (recurringExpense || 0);
        const projectedBalance = startingBalanceOfMonth + totalProjectedIncome - totalProjectedExpense;
        res.status(200).json({ currentBalance, projectedBalance, totalProjectedIncome, totalProjectedExpense });
    } catch (error) { res.status(500).json({ message: "Erreur lors du calcul du résumé." }); }
});

router.get('/summary/:year/:month', isAuth, async (req, res) => {
    const { year, month } = req.params;
    const userId = req.user.id;
    const startDateOfMonth = new Date(year, month - 1, 1);
    const endDateOfMonth = new Date(year, month, 0, 23, 59, 59);

    try {
        // --- 1. Calcul du Solde de Départ (CORRIGÉ) ---
        // Solde des transactions ponctuelles passées
        const oneTimeIncomeBefore = await Transaction.sum('amount', { where: { UserId: userId, type: 'income', transactionType: 'one-time', date: { [Op.lt]: startDateOfMonth } } });
        const oneTimeExpenseBefore = await Transaction.sum('amount', { where: { UserId: userId, type: 'expense', transactionType: 'one-time', date: { [Op.lt]: startDateOfMonth } } });
        let startingBalance = (oneTimeIncomeBefore || 0) - (oneTimeExpenseBefore || 0);

        // Ajout des occurrences des transactions récurrentes passées
        const recurringTransactionsBefore = await Transaction.findAll({
            where: { UserId: userId, transactionType: 'recurring', startDate: { [Op.lt]: startDateOfMonth } }
        });

        recurringTransactionsBefore.forEach(r => {
            let occurrences = 0;
            let currentDate = new Date(r.startDate);
            const endDate = r.endDate ? new Date(r.endDate) : startDateOfMonth;

            while (currentDate < startDateOfMonth && currentDate <= endDate) {
                if (r.frequency === 'monthly') {
                    occurrences++;
                    currentDate.setMonth(currentDate.getMonth() + 1);
                } else {
                    break; 
                }
            }
            if (r.type === 'income') {
                startingBalance += occurrences * r.amount;
            } else {
                startingBalance -= occurrences * r.amount;
            }
        });

        // --- 2. Calcul des flux du mois (logique inchangée mais vérifiée) ---
        const oneTimeIncomeMonth = await Transaction.sum('amount', { where: { UserId: userId, type: 'income', transactionType: 'one-time', date: { [Op.between]: [startDateOfMonth, endDateOfMonth] } } });
        const recurringIncomeMonth = await Transaction.sum('amount', { where: { UserId: userId, type: 'income', transactionType: 'recurring', startDate: { [Op.lte]: endDateOfMonth }, [Op.or]: [{ endDate: { [Op.is]: null } }, { endDate: { [Op.gte]: startDateOfMonth } }] } });
        const totalIncome = (oneTimeIncomeMonth || 0) + (recurringIncomeMonth || 0);

        const oneTimeExpenseMonth = await Transaction.sum('amount', { where: { UserId: userId, type: 'expense', transactionType: 'one-time', date: { [Op.between]: [startDateOfMonth, endDateOfMonth] } } });
        const recurringExpenseMonth = await Transaction.sum('amount', { where: { UserId: userId, type: 'expense', transactionType: 'recurring', startDate: { [Op.lte]: endDateOfMonth }, [Op.or]: [{ endDate: { [Op.is]: null } }, { endDate: { [Op.gte]: startDateOfMonth } }] } });
        const totalExpense = (oneTimeExpenseMonth || 0) + (recurringExpenseMonth || 0);

        res.status(200).json({ startingBalance, totalIncome, totalExpense });
    } catch (error) {
        console.error("Erreur résumé mensuel:", error);
        res.status(500).json({ message: "Erreur lors du calcul du résumé mensuel." });
    }
});


// --- Route pour les stats du graphique en barres ---
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

// --- Route pour les stats du graphique camembert ---
router.get('/stats/expenses-by-category', isAuth, async (req, res) => {
    const userId = req.user.id;
    try {
        const results = await Transaction.findAll({
            attributes: [
                [col('Categories.name'), 'categoryName'],
                [col('Categories.color'), 'categoryColor'],
                [fn('sum', col('Transaction.amount')), 'total']
            ],
            include: [{
                model: Category,
                attributes: [],
                required: true // On garde required car on ne veut que les dépenses catégorisées
            }],
            where: { UserId: userId, type: 'expense' },
            group: ['Categories.id', 'Categories.name', 'Categories.color'],
            raw: true
        });
        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des statistiques." });
    }
});

// --- ROUTE CORRIGÉE ---
router.post('/', isAuth, async (req, res) => {
    const { label, amount, type, transactionType, date, frequency, startDate, endDate, dayOfMonth, categoryIds, ProjectBudgetId } = req.body;
    
    try {
        // Validation serveur : si un budget projet est associé
        if (ProjectBudgetId && type === 'expense') {
            const budget = await ProjectBudget.findOne({ where: { id: ProjectBudgetId, UserId: req.user.id }});
            if (!budget) {
                return res.status(404).json({ message: "Budget de projet non trouvé."});
            }
            const transactionDate = transactionType === 'one-time' ? new Date(date) : new Date(startDate);
            if (transactionDate < new Date(budget.startDate) || transactionDate > new Date(budget.endDate)) {
                return res.status(400).json({ message: "Validation échouée : La date de la transaction est en dehors de la période du budget de projet." });
            }
        }

        const newTransaction = await Transaction.create({
            label, amount, type, transactionType, date, frequency, startDate, endDate, dayOfMonth, 
            ProjectBudgetId: ProjectBudgetId || null,
            UserId: req.user.id
        });

        if (categoryIds && categoryIds.length > 0) {
            await newTransaction.setCategories(categoryIds);
        }

        const result = await Transaction.findByPk(newTransaction.id, { include: [Category] });
        res.status(201).json(result);

    } catch (error) { 
        console.error("Erreur POST /transactions:", error);
        res.status(500).json({ message: "Erreur lors de la création." }); 
    }
});


router.put('/:id', isAuth, async (req, res) => {
    const { label, amount, type, transactionType, date, frequency, startDate, endDate, dayOfMonth, categoryIds, ProjectBudgetId } = req.body;
    try {
        const transaction = await Transaction.findOne({ where: { id: req.params.id, UserId: req.user.id } });
        if (!transaction) return res.status(404).json({ message: "Transaction non trouvée." });

        await transaction.update({ label, amount, type, transactionType, date, frequency, startDate, endDate, dayOfMonth, ProjectBudgetId });
        if (categoryIds) {
            await transaction.setCategories(categoryIds);
        }
        const updatedTransaction = await Transaction.findByPk(req.params.id, { include: [Category] });
        res.status(200).json(updatedTransaction);
    } catch (error) { res.status(500).json({ message: 'Erreur lors de la modification.' }); }
});

router.delete('/:id', isAuth, async (req, res) => {
    const transactionId = req.params.id;
    const userId = req.user.id;
    try {
        const transaction = await Transaction.findOne({ where: { id: transactionId, UserId: userId } });
        if (!transaction) { return res.status(404).json({ message: "Transaction non trouvée." }); }
        await transaction.destroy();
        res.status(200).json({ message: 'Transaction supprimée avec succès.' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression de la transaction.' });
    }
});


module.exports = router;