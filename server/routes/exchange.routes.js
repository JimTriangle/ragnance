const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const isAuth = require('../middleware/isAuth');
const ExchangeKey = require('../models/ExchangeKey.model');
const { encrypt, decrypt, mask } = require('../utils/encryption');
const createClient = require('../services/exchanges/ccxtClient');
const rateMap = new Map();
function checkRateLimit(userId, exchange) {
  const key = `${userId}:${exchange}`;
  const now = Date.now();
  const arr = rateMap.get(key) || [];
  const recent = arr.filter(ts => now - ts < 60000);
  if (recent.length >= 5) return false;
  recent.push(now);
  rateMap.set(key, recent);
  return true;
}

async function performTest({ exchange, apiKey, apiSecret, sandbox }) {
  const start = Date.now();
  console.log(`[performTest] Connecting to ${exchange} (sandbox=${!!sandbox})`);
  try {
    if (process.env.MOCK_MODE === 'true') {
      const duration = Date.now() - start;
      console.log(`[performTest] Mock success in ${duration}ms`);
      return { ok: true, exchangeTime: Date.now(), duration };
    }
    const ex = createClient({ exchange, apiKey, secret: apiSecret, sandbox });
    await ex.loadMarkets();
    await ex.fetchBalance();
    const duration = Date.now() - start;
    console.log(`[performTest] ${exchange} test succeeded in ${duration}ms`);
    return { ok: true, exchangeTime: Date.now(), duration };
  } catch (err) {
    const duration = Date.now() - start;
    console.log(`[performTest] ${exchange} test failed after ${duration}ms: ${err.message}`);
    throw err;
  }
}

router.use(isAuth);

router.get('/', async (req, res) => {
  const items = await ExchangeKey.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'ASC']] });
  const response = items.map((k) => {
    let secretMask = '****';
    try { secretMask = mask(decrypt(k.apiSecretEnc)); } catch (e) { }
    return {
      id: k.id,
      exchange: k.exchange,
      label: k.label,
      sandbox: k.sandbox,
      meta: k.meta,
      createdAt: k.createdAt,
      secretMask,
    };
  });
  res.json({ items: response });
});

router.post('/', async (req, res) => {
  const { exchange, label, apiKey, apiSecret, sandbox } = req.body;
  if (!process.env.ENCRYPTION_KEY) {
    return res.status(500).json({ error: { code: 'ENCRYPTION_MISSING', message: 'Encryption key missing' } });
  }
  try {
    await performTest({ exchange, apiKey, apiSecret, sandbox });
  } catch (err) {
    return res.status(400).json({ error: { code: 'AUTH_FAILED', message: err.message } });
  }
  const id = 'ek_' + crypto.randomUUID();
  const apiSecretEnc = encrypt(apiSecret);
  const now = new Date().toISOString();
  await ExchangeKey.create({
    id,
    userId: req.user.id,
    exchange,
    label,
    apiKey,
    apiSecretEnc,
    sandbox: !!sandbox,
    meta: { lastTestAt: now, lastTestStatus: 'VALID', lastTestMessage: 'OK' },
  });
  res.status(201).json({ id });
});

router.get('/:id', async (req, res) => {
  const key = await ExchangeKey.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!key) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Key not found' } });
  let secretMask = '****';
  try { secretMask = mask(decrypt(key.apiSecretEnc)); } catch (e) { }
  res.json({
    id: key.id,
    exchange: key.exchange,
    label: key.label,
    sandbox: key.sandbox,
    meta: key.meta,
    createdAt: key.createdAt,
    secretMask,
  });
});

router.put('/:id', async (req, res) => {
  const { label, sandbox } = req.body;
  const key = await ExchangeKey.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!key) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Key not found' } });
  key.label = label ?? key.label;
  if (sandbox !== undefined) key.sandbox = sandbox;
  await key.save();
  res.json({ ok: true });
});

async function rotateSecretHandler(req, res) {
  const { apiKey, apiSecret } = req.body;
  const key = await ExchangeKey.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!key) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Key not found' } });
  if (!process.env.ENCRYPTION_KEY) {
    return res.status(500).json({ error: { code: 'ENCRYPTION_MISSING', message: 'Encryption key missing' } });
  }
  try {
    await performTest({ exchange: key.exchange, apiKey, apiSecret, sandbox: key.sandbox });
  } catch (err) {
    return res.status(400).json({ error: { code: 'TEST_FAILED', message: 'Exchange authentication failed', details: { exchange: key.exchange } } });
  }
  key.apiKey = apiKey;
  key.apiSecretEnc = encrypt(apiSecret);
  const now = new Date().toISOString();
  key.meta = { ...(key.meta || {}), lastTestAt: now, lastTestStatus: 'VALID', lastTestMessage: 'OK' };
  await key.save();
  res.json({ ok: true });
}

router.patch('/:id/secret', rotateSecretHandler);
router.post('/:id/rotate-secret', rotateSecretHandler);

router.delete('/:id', async (req, res) => {
  const key = await ExchangeKey.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!key) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Key not found' } });
  await key.destroy();
  res.json({ ok: true });
});

router.post('/test', async (req, res) => {
  let { exchange, apiKey, apiSecret, sandbox, id } = req.body;
  let existing;
  if (id) {
    existing = await ExchangeKey.findOne({ where: { id, userId: req.user.id } });
    if (existing) {
      exchange = existing.exchange;
      sandbox = sandbox !== undefined ? sandbox : existing.sandbox;
      if (!apiKey || !apiSecret) {
        apiKey = existing.apiKey;
        try { apiSecret = decrypt(existing.apiSecretEnc); } catch (e) { }
      }
    }
  }
  if (!checkRateLimit(req.user.id, exchange)) {
    return res.status(429).json({ error: { code: 'RATE_LIMIT', message: 'Too many tests, try later' } });
  }
  try {
    const result = await performTest({ exchange, apiKey, apiSecret, sandbox });
    if (existing) {
      const now = new Date().toISOString();
      existing.meta = { ...(existing.meta || {}), lastTestAt: now, lastTestStatus: 'VALID', lastTestMessage: 'OK' };
      await existing.save();
    }
    res.json({ ok: true, exchangeTime: result.exchangeTime });
  } catch (err) {
    if (existing) {
      const now = new Date().toISOString();
      existing.meta = { ...(existing.meta || {}), lastTestAt: now, lastTestStatus: 'ERROR', lastTestMessage: err.message };
      await existing.save();
    }
    res.status(400).json({ error: { code: 'AUTH_FAILED', message: err.message } });
  }
});

router.post('/:id/test', async (req, res) => {
  const id = req.params.id;
  let { apiKey, apiSecret, sandbox } = req.body;
  const existing = await ExchangeKey.findOne({ where: { id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Key not found' } });
  const exchange = existing.exchange;
  sandbox = sandbox !== undefined ? sandbox : existing.sandbox;
  if (!apiKey || !apiSecret) {
    apiKey = existing.apiKey;
    try { apiSecret = decrypt(existing.apiSecretEnc); } catch (e) { }
  }
  if (!checkRateLimit(req.user.id, exchange)) {
    return res.status(429).json({ error: { code: 'RATE_LIMIT', message: 'Too many tests, try later' } });
  }
  try {
    const result = await performTest({ exchange, apiKey, apiSecret, sandbox });
    const now = new Date().toISOString();
    existing.meta = { ...(existing.meta || {}), lastTestAt: now, lastTestStatus: 'VALID', lastTestMessage: 'OK' };
    await existing.save();
    res.json({ ok: true, exchangeTime: result.exchangeTime });
  } catch (err) {
    const now = new Date().toISOString();
    existing.meta = { ...(existing.meta || {}), lastTestAt: now, lastTestStatus: 'ERROR', lastTestMessage: err.message };
    await existing.save();
    res.status(400).json({ error: { code: 'AUTH_FAILED', message: err.message } });
  }
});

module.exports = router;