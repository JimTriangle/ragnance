
import React, { useEffect, useState } from 'react';
import { fetchBots } from '../../services/bots';
import BotLogPanel from '../../components/BotLogPanel';

export default function BotsPage() {
  const [bots, setBots] = useState([]);
  const [openBot, setOpenBot] = useState(null);

  useEffect(() => {
    fetchBots().then(setBots);
  }, []);

  return (
    <div>
      <h1>Bots</h1>
      {bots.map(bot => (
        <div key={bot.id}>
          <div onClick={() => setOpenBot(openBot === bot.id ? null : bot.id)}>
            {bot.pair} - Budget: {bot.budget} - {bot.status}
          </div>
          {openBot === bot.id && <BotLogPanel botId={bot.id} />}
        </div>
      ))}
    </div>
  );
}