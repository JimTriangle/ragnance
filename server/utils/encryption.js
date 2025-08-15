const crypto = require('crypto');

function getKey() {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY missing');
  }
  return crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY).digest();
}

function encrypt(secret) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${encrypted.toString('base64')}.${tag.toString('base64')}`;
}

function decrypt(payload) {
  const key = getKey();
  const [ivB64, encryptedB64, tagB64] = payload.split('.');
  const iv = Buffer.from(ivB64, 'base64');
  const encrypted = Buffer.from(encryptedB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

function mask(secret) {
  const last4 = secret.slice(-4);
  return `****...${last4}`;
}

module.exports = { encrypt, decrypt, mask };