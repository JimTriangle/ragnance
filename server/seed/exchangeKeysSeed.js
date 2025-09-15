const ExchangeKey = require('../models/ExchangeKey.model');
const { encrypt } = require('../utils/encryption');
const User = require('../models/User.model');

module.exports = async () => {
  const count = await ExchangeKey.count();
  if (count > 0) return;
   const user = await User.findOne({ order: [['id', 'ASC']] });

  if (!user) {
    console.warn('Skipping exchange key seed: no user found to attach demo keys.');
    return;
  }
  const placeholder = encrypt('placeholder');
  await ExchangeKey.bulkCreate([
    {
      id: 'ek_seed_binance',
      userId: user.id,
      exchange: 'BINANCE',
      label: 'Binance demo',
      apiKey: 'BINANCE_KEY',
      apiSecretEnc: placeholder,
      sandbox: false,
      meta: { lastTestStatus: 'UNTESTED' },
    },
    {
      id: 'ek_seed_kraken',
      userId: user.id,
      exchange: 'KRAKEN',
      label: 'Kraken demo',
      apiKey: 'KRAKEN_KEY',
      apiSecretEnc: placeholder,
      sandbox: false,
      meta: { lastTestStatus: 'UNTESTED' },
    },
  ]);
};