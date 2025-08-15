const express = require('express');
const router = express.Router();

let status = 'STOPPED';

router.get('/status', (req, res) => {
  res.json({ status });
});

router.post('/start', (req, res) => {
  if (status === 'RUNNING') {
    return res.status(400).json({ error: { code: 'ALREADY_RUNNING', message: 'Bot already running' } });
  }
  status = 'RUNNING';
  res.json({ status });
});

router.post('/stop', (req, res) => {
  if (status === 'STOPPED') {
    return res.status(400).json({ error: { code: 'ALREADY_STOPPED', message: 'Bot already stopped' } });
  }
  status = 'STOPPED';
  res.json({ status });
});

module.exports = router;