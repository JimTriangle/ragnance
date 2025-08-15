const crypto = require('crypto');

function signKraken(path, body, secretB64) {
  const secret = Buffer.from(secretB64, 'base64');
  const hash = crypto.createHash('sha256');
  hash.update(body.get('nonce') + body.toString());
  const sha256 = hash.digest();
  const hmac = crypto.createHmac('sha512', secret);
  hmac.update(path);
  hmac.update(sha256);
  return hmac.digest('base64');
}

module.exports = { signKraken };