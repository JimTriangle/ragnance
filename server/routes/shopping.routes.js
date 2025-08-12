const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const ShoppingItem = require('../models/ShoppingItem.model');
const Transaction = require('../models/Transaction.model');
const Category = require('../models/Category.model'); // Importer Category
const { Op } = require('sequelize');

// ... (GET, POST, DELETE restent identiques, on ajoute le logging d'erreur)
router.get('/', isAuth, async (req, res) => {
  try {
    const items = await ShoppingItem.findAll({ where: { UserId: req.user.id, isPurchased: false }, order: [['createdAt', 'ASC']] });
    res.status(200).json(items);
  } catch (error) { 
    console.error("Erreur GET /shopping:", error);
    res.status(500).json({ message: "Erreur serveur" }); 
  }
});

router.post('/', isAuth, async (req, res) => {
  const { itemName, price } = req.body;
  try {
    const newItem = await ShoppingItem.create({ itemName, price, UserId: req.user.id });
    res.status(201).json(newItem);
  } catch (error) { 
    console.error("Erreur POST /shopping:", error);
    res.status(500).json({ message: "Erreur serveur" }); 
  }
});

router.delete('/:id', isAuth, async (req, res) => {
  try {
    const item = await ShoppingItem.findOne({ where: { id: req.params.id, UserId: req.user.id } });
    if (!item) return res.status(404).json({ message: "Article non trouvé." });
    await item.destroy();
    res.status(200).json({ message: "Article supprimé." });
  } catch (error) { 
    console.error("Erreur DELETE /shopping/:id:", error);
    res.status(500).json({ message: "Erreur serveur" }); 
  }
});


// --- Route pour marquer comme acheté (corrigée) ---
router.put('/:id/purchase', isAuth, async (req, res) => {
    try {
        const item = await ShoppingItem.findOne({ where: { id: req.params.id, UserId: req.user.id } });
        if (!item) return res.status(404).json({ message: "Article non trouvé." });

        item.isPurchased = true;
        await item.save();

        // On cherche une catégorie "Courses" (insensible à la casse)
        const coursesCategory = await Category.findOne({ 
            where: { 
                name: { [Op.iLike]: 'Courses' }, // iLike pour être insensible à la casse
                UserId: req.user.id 
            } 
        });

        const newTransaction = await Transaction.create({
            label: item.itemName,
            amount: item.price,
            type: 'expense',
            date: new Date(),
            transactionType: 'one-time',
            UserId: req.user.id
        });

        // Si la catégorie "Courses" existe, on l'associe. Sinon, la transaction reste sans catégorie.
        if (coursesCategory) {
            await newTransaction.setCategories([coursesCategory.id]);
        }
        
        res.status(200).json({ message: 'Article acheté et transaction créée.' });
    } catch (error) { 
        console.error("Erreur PUT /shopping/:id/purchase:", error);
        res.status(500).json({ message: "Erreur serveur" }); 
    }
});

module.exports = router;