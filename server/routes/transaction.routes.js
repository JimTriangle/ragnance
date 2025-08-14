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
            const endDateOfMonth = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59));

            // Les transactions ponctuelles sont déjà correctement filtrées par la BDD
            const oneTimeTransactions = await Transaction.findAll({ 
                where: { 
                    UserId: userId, 
                    transactionType: 'one-time', 
                    date: { [Op.between]: [startDateOfMonth, endDateOfMonth] } 
                }, 
                include: [Category] 
            });

            // On récupère toutes les transactions récurrentes qui pourraient s'appliquer
            const potentiallyRecurring = await Transaction.findAll({
                where: {
                    UserId: userId, 
                    transactionType: 'recurring', 
                    startDate: { [Op.lte]: endDateOfMonth }, // Doit avoir commencé avant la fin du mois
                    [Op.or]: [
                        { endDate: { [Op.is]: null } },       // Soit elle n'a pas de date de fin
                        { endDate: { [Op.gte]: startDateOfMonth } } // Soit sa fin est après le début du mois
                    ]
                },
                include: [Category]
            });

            // --- CORRECTIF : Logique de filtrage des transactions récurrentes ---
            const recurringTransactionsForMonth = potentiallyRecurring.filter(r => {
                const transactionStartDate = new Date(r.startDate);

                if (r.frequency === 'monthly') {
                    // Pour le mensuel, la requête SQL est suffisante, la transaction s'applique
                    return true;
                }
                
                if (r.frequency === 'yearly') {
                    // Pour l'annuel, on vérifie si le mois de la date de début correspond au mois en cours
                    // getUTCMonth() est 0-indexé (0-11), donc on ajoute 1
                    const transactionStartMonth = transactionStartDate.getUTCMonth() + 1;
                    return transactionStartMonth === currentMonth;
                }

                // Ajouter ici la logique pour 'weekly' si nécessaire
                
                return false;
            });


            const allTransactions = [...oneTimeTransactions, ...recurringTransactionsForMonth]
                .sort((a, b) => {
                    // Pour le tri, on crée une date valide pour les récurrentes dans le mois en cours
                    const dateA = a.date ? new Date(a.date) : new Date(Date.UTC(currentYear, currentMonth - 1, a.dayOfMonth || 1));
                    const dateB = b.date ? new Date(b.date) : new Date(Date.UTC(currentYear, currentMonth - 1, b.dayOfMonth || 1));
                    return dateB - dateA;
                });

            res.status(200).json(allTransactions);
        } else {
            // Logique fallback si pas de date fournie (inchangée)
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
    
    const currentMonth = parseInt(month, 10);
    const currentYear = parseInt(year, 10);

    const startDateOfMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const endDateOfMonth = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59));
    const endDateOfMonthStr = endDateOfMonth.toISOString().split('T')[0];

    try {
        // --- 1. Calcul du Solde de Départ (logique inchangée mais attention à sa complexité) ---
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
                if (r.frequency === 'monthly') {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                } else if (r.frequency === 'yearly') {
                    currentDate.setFullYear(currentDate.getFullYear() + 1);
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
        
        // --- 2. Calcul des flux du mois (logique corrigée) ---
        const oneTimeIncomeMonth = await Transaction.sum('amount', { where: { UserId: userId, type: 'income', transactionType: 'one-time', date: { [Op.between]: [startDateOfMonthStr, endDateOfMonthStr] } } });
        const oneTimeExpenseMonth = await Transaction.sum('amount', { where: { UserId: userId, type: 'expense', transactionType: 'one-time', date: { [Op.between]: [startDateOfMonthStr, endDateOfMonthStr] } } });

        const potentiallyRecurringMonth = await Transaction.findAll({ 
            where: { 
                UserId: userId, 
                transactionType: 'recurring', 
                startDate: { [Op.lte]: endDateOfMonthStr },
                [Op.or]: [{ endDate: { [Op.is]: null } }, { endDate: { [Op.gte]: startDateOfMonthStr } }] 
            } 
        });

        let recurringIncomeMonth = 0;
        let recurringExpenseMonth = 0;

        potentiallyRecurringMonth.forEach(r => {
            const transactionStartDate = new Date(r.startDate);
            let appliesThisMonth = false;

            if (r.frequency === 'monthly') {
                appliesThisMonth = true;
            } else if (r.frequency === 'yearly') {
                const transactionStartMonth = transactionStartDate.getUTCMonth() + 1;
                if (transactionStartMonth === currentMonth) {
                    appliesThisMonth = true;
                }
            }
            
            if (appliesThisMonth) {
                if (r.type === 'income') {
                    recurringIncomeMonth += r.amount;
                } else {
                    recurringExpenseMonth += r.amount;
                }
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
                required: true
            }],
            where: { UserId: userId, type: 'expense' },
            group: ['Categories.id', 'Categories.name', 'Categories.color'],
            order: [[fn('sum', col('Transaction.amount')), 'DESC']], // On trie par total décroissant
            raw: true
        });

        const TOP_N = 6;
        let finalResults = results;

        // Si on a plus de catégories que notre limite, on regroupe les autres
        if (results.length > TOP_N) {
            const topResults = results.slice(0, TOP_N);
            const otherResults = results.slice(TOP_N);

            const otherTotal = otherResults.reduce((sum, item) => sum + item.total, 0);

            finalResults = [
                ...topResults,
                {
                    categoryName: 'Autres',
                    categoryColor: '#888888', // Une couleur neutre pour "Autres"
                    total: otherTotal
                }
            ];
        }

        res.status(200).json(finalResults);
    } catch (error) {
        console.error("Erreur stats/expenses-by-category:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des statistiques." });
    }
});


// --- ROUTE CORRIGÉE ---
router.post('/', isAuth, async (req, res) => {
    const { label, amount, type, transactionType, date, frequency, startDate, endDate, dayOfMonth, categoryIds, ProjectBudgetId } = req.body;

    try {
        // Validation serveur : si un budget projet est associé
        if (ProjectBudgetId && type === 'expense') {
            const budget = await ProjectBudget.findOne({ where: { id: ProjectBudgetId, UserId: req.user.id } });
            if (!budget) {
                return res.status(404).json({ message: "Budget de projet non trouvé." });
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