const express = require('express');
const router = express.Router();
const ExpenseCalculatorMonth = require('../models/ExpenseCalculatorMonth.model');

// GET /api/expense-calculator/:year/:month
// Récupère les données du calculateur pour un mois donné
router.get('/:year/:month', async (req, res) => {
  const { year, month } = req.params;
  const userId = req.user.id;
  try {
    const record = await ExpenseCalculatorMonth.findOne({
      where: { UserId: userId, year: parseInt(year), month: parseInt(month) }
    });
    if (!record) {
      return res.status(200).json({ people: [], expenses: [] });
    }
    res.status(200).json({ people: record.people, expenses: record.expenses });
  } catch (error) {
    console.error('Erreur GET expense-calculator:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /api/expense-calculator/:year/:month
// Crée ou met à jour les données du calculateur pour un mois donné
router.put('/:year/:month', async (req, res) => {
  const { year, month } = req.params;
  const { people, expenses } = req.body;
  const userId = req.user.id;
  try {
    const [record, created] = await ExpenseCalculatorMonth.findOrCreate({
      where: { UserId: userId, year: parseInt(year), month: parseInt(month) },
      defaults: { people: people || [], expenses: expenses || [] }
    });
    if (!created) {
      await record.update({ people: people || [], expenses: expenses || [] });
    }
    res.status(200).json({ people: record.people, expenses: record.expenses });
  } catch (error) {
    console.error('Erreur PUT expense-calculator:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/expense-calculator/months
// Retourne la liste des mois (YYYY-MM) ayant des données pour l'utilisateur
router.get('/months/list', async (req, res) => {
  const userId = req.user.id;
  try {
    const records = await ExpenseCalculatorMonth.findAll({
      where: { UserId: userId },
      attributes: ['year', 'month'],
      order: [['year', 'DESC'], ['month', 'DESC']]
    });
    const months = records.map(r => `${r.year}-${String(r.month).padStart(2, '0')}`);
    res.status(200).json(months);
  } catch (error) {
    console.error('Erreur GET expense-calculator/months:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
