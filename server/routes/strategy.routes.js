const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const Strategy = require('../models/Strategy.model');
const registry = require('../utils/StrategyRegistry');

router.use(isAuth);

router.get('/strategy-kinds', (req, res) => {
  res.json({ items: registry.listKinds() });
});

router.get('/strategies', async (req, res) => {
  const items = await Strategy.findAll({ where: { UserId: req.user.id }, order: [['updatedAt', 'DESC']] });
  const list = items.map((s) => ({ id: s.id, name: s.name, kind: s.kind, updatedAt: s.updatedAt, backtestsCount: s.backtestsCount }));
  res.json({ items: list });
});

router.post('/strategies', async (req, res) => {
  const { name, kind, params } = req.body;
  if (!name || !kind) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Missing fields' } });
  const unique = await Strategy.findOne({ where: { name, UserId: req.user.id } });
  if (unique) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Name already used', details: { name: 'unique' } } });
  const v = registry.validate(kind, params || {});
  if (!v.ok) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Params invalid', details: v.errors } });
  const id = 'st_' + crypto.randomUUID();
  await Strategy.create({ id, name, kind, params, UserId: req.user.id });
  res.status(201).json({ id });
});

router.get('/strategies/:id', async (req, res) => {
  const s = await Strategy.findOne({ where: { id: req.params.id, UserId: req.user.id } });
  if (!s) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Strategy not found' } });
  res.json({ id: s.id, name: s.name, kind: s.kind, params: s.params, backtestsCount: s.backtestsCount, robotsUsing: [] });
});

router.put('/strategies/:id', async (req, res) => {
  const s = await Strategy.findOne({ where: { id: req.params.id, UserId: req.user.id } });
  if (!s) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Strategy not found' } });
  const { name, params } = req.body;
  if (name && name !== s.name) {
    const unique = await Strategy.findOne({ where: { name, UserId: req.user.id } });
    if (unique) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Name already used', details: { name: 'unique' } } });
    s.name = name;
  }
  if (params) {
    const v = registry.validate(s.kind, params);
    if (!v.ok) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Params invalid', details: v.errors } });
    s.params = params;
  }
  await s.save();
  res.json({ ok: true });
});

router.delete('/strategies/:id', async (req, res) => {
  const s = await Strategy.findOne({ where: { id: req.params.id, UserId: req.user.id } });
  if (!s) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Strategy not found' } });
  if (s.robotsCount && s.robotsCount > 0) {
    return res.status(409).json({ error: { code: 'IN_USE', message: 'Strategy in use by robots', details: { robotIds: [] } } });
  }
  await s.destroy();
  res.json({ ok: true });
});

router.post('/strategies/validate', (req, res) => {
  const { kind, params } = req.body;
  const v = registry.validate(kind, params || {});
  if (!v.ok) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid params', details: v.errors } });
  res.json({ ok: true });
});

router.post('/strategies/preview', (req, res) => {
  const { kind, params, limit } = req.body;
  const prev = registry.preview(kind, params || {}, { limit });
  res.json(prev);
});

module.exports = router;