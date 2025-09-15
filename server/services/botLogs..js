const bots = [
  { id: 'bot1', pair: 'BTC/USDT', budget: 1000, status: 'running', lastActivityAt: new Date().toISOString() },
  { id: 'bot2', pair: 'ETH/USDT', budget: 500, status: 'running', lastActivityAt: new Date().toISOString() },
];

const logs = {};
const listeners = {};

function addLog(botId, level, event, message, meta = {}) {
  const entry = { botId, ts: new Date().toISOString(), level, event, message, meta };
  logs[botId] = [...(logs[botId] || []), entry].slice(-200);
  const bot = bots.find(b => b.id === botId);
  if (bot) {
    bot.lastActivityAt = entry.ts;
  }
  (listeners[botId] || []).forEach(fn => fn(entry));
}

function getBots() {
  return bots;
}

function getLogs(botId) {
  return logs[botId] || [];
}

function subscribe(botId, fn) {
  if (!listeners[botId]) listeners[botId] = [];
  listeners[botId].push(fn);
  return () => {
    listeners[botId] = listeners[botId].filter(f => f !== fn);
  };
}

function simulateBot(bot) {
  const wait = ms => new Promise(res => setTimeout(res, ms));
  (async () => {
    addLog(bot.id, 'INFO', 'BOT_STARTING', 'Bot starting');
    await wait(500);
    addLog(bot.id, 'INFO', 'BOT_STARTED', 'Bot started');
    await wait(500);
    addLog(bot.id, 'INFO', 'CONNECTING', 'Connecting to exchange');
    await wait(500);
    addLog(bot.id, 'INFO', 'CONNECTED', 'Connected');
    startCycles();
  })();

  function startCycles() {
    const tradeInterval = setInterval(() => {
      addLog(bot.id, 'INFO', 'TRADE_PLACED', 'Order placed');
      setTimeout(() => {
        if (Math.random() > 0.2) {
          addLog(bot.id, 'INFO', 'TRADE_FILLED', 'Order filled');
        } else {
          addLog(bot.id, 'ERROR', 'TRADE_FAILED', 'Order failed');
        }
      }, 500);
    }, 2000);

    const heartbeat = setInterval(() => {
      addLog(bot.id, 'INFO', 'HEARTBEAT', 'Heartbeat');
    }, 5000);

    setTimeout(() => {
      clearInterval(tradeInterval);
      clearInterval(heartbeat);
      addLog(bot.id, 'WARN', 'DISCONNECTED', 'Connection lost');
      addLog(bot.id, 'INFO', 'RECONNECTING', 'Reconnecting');
      setTimeout(() => {
        addLog(bot.id, 'INFO', 'RECONNECTED', 'Reconnected');
        startCycles();
      }, 1000);
    }, 10000);
  }
}

bots.forEach(simulateBot);

function setupBotLogWebSocket(server) {
  const WebSocket = require('ws');
  const wss = new WebSocket.Server({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const match = req.url.match(/^\/ws\/bots\/([^/]+)\/logs$/);
    if (!match) {
      socket.destroy();
      return;
    }
    const botId = match[1];
    wss.handleUpgrade(req, socket, head, ws => {
      getLogs(botId).forEach(log => ws.send(JSON.stringify(log)));
      const unsubscribe = subscribe(botId, log => ws.send(JSON.stringify(log)));
      ws.on('close', unsubscribe);
    });
  });
}

module.exports = {
  getBots,
  getLogs,
  subscribe,
  setupBotLogWebSocket,
  addLog,
};