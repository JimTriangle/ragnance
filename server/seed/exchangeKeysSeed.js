const ExchangeKey = require('../models/ExchangeKey.model');
const { encrypt } = require('../utils/encryption');

module.exports = async () => {
  const count = await ExchangeKey.count();
  if (count > 0) return;
  const placeholder = encrypt('placeholder');
  await ExchangeKey.bulkCreate([
    {
      id: 'ek_seed_binance',
      userId: '1',
      exchange: 'BINANCE',
      label: 'Binance demo',
      apiKey: 'BINANCE_KEY',
      apiSecretEnc: placeholder,
      sandbox: false,
      meta: { lastTestStatus: 'UNTESTED' },
    },
    {
      id: 'ek_seed_kraken',
      userId: '1',
      exchange: 'KRAKEN',
      label: 'Kraken demo',
      apiKey: 'KRAKEN_KEY',
      apiSecretEnc: placeholder,
      sandbox: false,
      meta: { lastTestStatus: 'UNTESTED' },
    },
  ]);
};