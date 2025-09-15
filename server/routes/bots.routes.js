const router = require('express').Router();
const { getBots, getLogs, subscribe } = require('../services/botLogs');

router.get('/', (req, res) => {
  res.json(getBots());
});

router.get('/:id/logs/stream', (req, res) => {
  const { id } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();

  getLogs(id).forEach(log => {
    res.write(`data: ${JSON.stringify(log)}\n\n`);
  });

  const unsubscribe = subscribe(id, log => {
    res.write(`data: ${JSON.stringify(log)}\n\n`);
  });

  req.on('close', () => {
    unsubscribe();
  });
});

module.exports = router;