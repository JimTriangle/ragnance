const express = require('express');
const router = express.Router();
const Savings = require('../models/Savings.model');
const SavingsPart = require('../models/SavingsPart.model');

// GET /api/savings - Lister toutes les épargnes
router.get('/', async (req, res) => {
    try {
        const includeArchived = req.query.includeArchived === 'true';
        const whereClause = { UserId: req.user.id };

        if (!includeArchived) {
            whereClause.archived = false;
        }

        const savings = await Savings.findAll({
            where: whereClause,
            include: [{
                model: SavingsPart,
                as: 'parts'
            }],
            order: [['archived', 'ASC'], ['createdAt', 'DESC']]
        });

        res.status(200).json(savings);
    } catch (error) {
        console.error("Erreur récupération épargnes:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// POST /api/savings - Créer une épargne
router.post('/', async (req, res) => {
    const { name, totalAmount, parts = [] } = req.body;
    try {
        const newSavings = await Savings.create({
            name,
            totalAmount,
            UserId: req.user.id
        });

        // Créer les parts si fournies (filtrer les parts invalides)
        if (parts && parts.length > 0) {
            const validParts = parts.filter(part =>
                part.description && part.description.trim() !== '' &&
                part.amount !== null && part.amount !== undefined && part.amount > 0
            );

            if (validParts.length > 0) {
                await Promise.all(validParts.map(part =>
                    SavingsPart.create({
                        description: part.description,
                        amount: part.amount,
                        SavingsId: newSavings.id
                    })
                ));
            }
        }

        // Recharger avec les parts
        const savingsWithParts = await Savings.findByPk(newSavings.id, {
            include: [{ model: SavingsPart, as: 'parts' }]
        });

        res.status(201).json(savingsWithParts);
    } catch (error) {
        console.error("Erreur création épargne:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// PUT /api/savings/:id - Modifier une épargne
router.put('/:id', async (req, res) => {
    try {
        const savings = await Savings.findOne({
            where: { id: req.params.id, UserId: req.user.id }
        });
        if (!savings) return res.status(404).json({ message: "Épargne non trouvée." });

        const { name, totalAmount, parts } = req.body;

        // Mettre à jour l'épargne
        await savings.update({ name, totalAmount });

        // Si des parts sont fournies, les synchroniser
        if (parts !== undefined) {
            // Supprimer toutes les parts existantes
            await SavingsPart.destroy({ where: { SavingsId: savings.id } });

            // Créer les nouvelles parts (filtrer les parts invalides)
            if (parts.length > 0) {
                const validParts = parts.filter(part =>
                    part.description && part.description.trim() !== '' &&
                    part.amount !== null && part.amount !== undefined && part.amount > 0
                );

                if (validParts.length > 0) {
                    await Promise.all(validParts.map(part =>
                        SavingsPart.create({
                            description: part.description,
                            amount: part.amount,
                            SavingsId: savings.id
                        })
                    ));
                }
            }
        }

        // Recharger avec les parts
        const updatedSavings = await Savings.findByPk(savings.id, {
            include: [{ model: SavingsPart, as: 'parts' }]
        });

        res.status(200).json(updatedSavings);
    } catch (error) {
        console.error("Erreur modification épargne:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// PATCH /api/savings/:id/archive - Archiver ou désarchiver une épargne
router.patch('/:id/archive', async (req, res) => {
    try {
        const savings = await Savings.findOne({
            where: { id: req.params.id, UserId: req.user.id }
        });
        if (!savings) return res.status(404).json({ message: "Épargne non trouvée." });

        await savings.update({ archived: !savings.archived });

        // Recharger avec les parts
        const updatedSavings = await Savings.findByPk(savings.id, {
            include: [{ model: SavingsPart, as: 'parts' }]
        });

        res.status(200).json(updatedSavings);
    } catch (error) {
        console.error("Erreur archivage épargne:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// DELETE /api/savings/:id - Supprimer une épargne
router.delete('/:id', async (req, res) => {
    try {
        const savings = await Savings.findOne({
            where: { id: req.params.id, UserId: req.user.id }
        });
        if (!savings) return res.status(404).json({ message: "Épargne non trouvée." });

        await savings.destroy();
        res.status(200).json({ message: "Épargne supprimée." });
    } catch (error) {
        console.error("Erreur suppression épargne:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

module.exports = router;
