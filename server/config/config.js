// server/config/config.js
const path = require("path");
const storagePath = path.resolve(__dirname, "../ragnance.sqlite");

const base = {
  dialect: "sqlite",
  storage: storagePath,
  logging: false, // mets true si tu veux voir les SQL
  dialectOptions: {},
};

module.exports = {
  development: { ...base },
  test:        { ...base, storage: storagePath.replace(".sqlite", ".test.sqlite") },
  production:  { ...base },
};
