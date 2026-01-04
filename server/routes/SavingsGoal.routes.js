const express = require('express');
const router = express.Router();
const SavingsGoal = require('../models/SavingsGoal.model');
const SavingsGoalContribution = require('../models/SavingsGoalContribution.model');

// GET /api/savings-goals - Lister tous les objectifs d'épargne
router.get('/', async (req, res) => {
    try {
        const includeArchived = req.query.includeArchived === 'true';
        const whereClause = { UserId: req.user.id };

        if (!includeArchived) {
            whereClause.archived = false;
        }

        const goals = await SavingsGoal.findAll({
            where: whereClause,
            include: [{
                model: SavingsGoalContribution,
                as: 'contributions',
                order: [['contributionDate', 'DESC']]
            }],
            order: [['archived', 'ASC'], ['targetDate', 'ASC']]
        });

        res.status(200).json(goals);
    } catch (error) {
        console.error("Erreur récupération objectifs d'épargne:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// POST /api/savings-goals - Créer un objectif d'épargne
router.post('/', async (req, res) => {
    const { name, description, targetAmount, startDate, targetDate } = req.body;
    try {
        // Validation
        if (!name || !targetAmount || !startDate || !targetDate) {
            return res.status(400).json({ message: "Tous les champs obligatoires doivent être remplis." });
        }

        if (new Date(targetDate) <= new Date(startDate)) {
            return res.status(400).json({ message: "La date de fin doit être postérieure à la date de début." });
        }

        const newGoal = await SavingsGoal.create({
            name,
            description,
            targetAmount,
            currentAmount: 0,
            startDate,
            targetDate,
            UserId: req.user.id
        });

        // Recharger avec les contributions
        const goalWithContributions = await SavingsGoal.findByPk(newGoal.id, {
            include: [{ model: SavingsGoalContribution, as: 'contributions' }]
        });

        res.status(201).json(goalWithContributions);
    } catch (error) {
        console.error("Erreur création objectif d'épargne:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// PUT /api/savings-goals/:id - Modifier un objectif d'épargne
router.put('/:id', async (req, res) => {
    try {
        const goal = await SavingsGoal.findOne({
            where: { id: req.params.id, UserId: req.user.id }
        });
        if (!goal) return res.status(404).json({ message: "Objectif d'épargne non trouvé." });

        const { name, description, targetAmount, startDate, targetDate } = req.body;

        // Validation
        if (new Date(targetDate) <= new Date(startDate)) {
            return res.status(400).json({ message: "La date de fin doit être postérieure à la date de début." });
        }

        // Mettre à jour l'objectif
        await goal.update({ name, description, targetAmount, startDate, targetDate });

        // Recharger avec les contributions
        const updatedGoal = await SavingsGoal.findByPk(goal.id, {
            include: [{ model: SavingsGoalContribution, as: 'contributions' }]
        });

        res.status(200).json(updatedGoal);
    } catch (error) {
        console.error("Erreur modification objectif d'épargne:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// PATCH /api/savings-goals/:id/archive - Archiver ou désarchiver un objectif
router.patch('/:id/archive', async (req, res) => {
    try {
        const goal = await SavingsGoal.findOne({
            where: { id: req.params.id, UserId: req.user.id }
        });
        if (!goal) return res.status(404).json({ message: "Objectif d'épargne non trouvé." });

        await goal.update({ archived: !goal.archived });

        // Recharger avec les contributions
        const updatedGoal = await SavingsGoal.findByPk(goal.id, {
            include: [{ model: SavingsGoalContribution, as: 'contributions' }]
        });

        res.status(200).json(updatedGoal);
    } catch (error) {
        console.error("Erreur archivage objectif d'épargne:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// DELETE /api/savings-goals/:id - Supprimer un objectif d'épargne
router.delete('/:id', async (req, res) => {
    try {
        const goal = await SavingsGoal.findOne({
            where: { id: req.params.id, UserId: req.user.id }
        });
        if (!goal) return res.status(404).json({ message: "Objectif d'épargne non trouvé." });

        await goal.destroy();
        res.status(200).json({ message: "Objectif d'épargne supprimé." });
    } catch (error) {
        console.error("Erreur suppression objectif d'épargne:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// POST /api/savings-goals/:id/contributions - Ajouter une contribution
router.post('/:id/contributions', async (req, res) => {
    try {
        const goal = await SavingsGoal.findOne({
            where: { id: req.params.id, UserId: req.user.id }
        });
        if (!goal) return res.status(404).json({ message: "Objectif d'épargne non trouvé." });

        const { amount, contributionDate, note } = req.body;

        // Validation
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Le montant doit être supérieur à 0." });
        }

        if (!contributionDate) {
            return res.status(400).json({ message: "La date de contribution est requise." });
        }

        // Créer la contribution
        const contribution = await SavingsGoalContribution.create({
            amount,
            contributionDate,
            note,
            SavingsGoalId: goal.id
        });

        // Mettre à jour le montant actuel de l'objectif
        await goal.update({
            currentAmount: goal.currentAmount + parseFloat(amount)
        });

        // Recharger avec les contributions
        const updatedGoal = await SavingsGoal.findByPk(goal.id, {
            include: [{
                model: SavingsGoalContribution,
                as: 'contributions',
                order: [['contributionDate', 'DESC']]
            }]
        });

        res.status(201).json(updatedGoal);
    } catch (error) {
        console.error("Erreur ajout contribution:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// DELETE /api/savings-goals/:goalId/contributions/:id - Supprimer une contribution
router.delete('/:goalId/contributions/:id', async (req, res) => {
    try {
        const goal = await SavingsGoal.findOne({
            where: { id: req.params.goalId, UserId: req.user.id }
        });
        if (!goal) return res.status(404).json({ message: "Objectif d'épargne non trouvé." });

        const contribution = await SavingsGoalContribution.findOne({
            where: { id: req.params.id, SavingsGoalId: goal.id }
        });
        if (!contribution) return res.status(404).json({ message: "Contribution non trouvée." });

        // Mettre à jour le montant actuel de l'objectif
        await goal.update({
            currentAmount: Math.max(0, goal.currentAmount - contribution.amount)
        });

        // Supprimer la contribution
        await contribution.destroy();

        // Recharger avec les contributions
        const updatedGoal = await SavingsGoal.findByPk(goal.id, {
            include: [{
                model: SavingsGoalContribution,
                as: 'contributions',
                order: [['contributionDate', 'DESC']]
            }]
        });

        res.status(200).json(updatedGoal);
    } catch (error) {
        console.error("Erreur suppression contribution:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

module.exports = router;
