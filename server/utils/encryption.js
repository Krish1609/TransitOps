const CryptoJS = require('crypto-js');
const SECRET = process.env.ENCRYPTION_KEY || 'default_sec_dev_key_369';

function encrypt(text) {
  if (!text) return '';
  try {
    return CryptoJS.AES.encrypt(text.toString(), SECRET).toString();
  } catch (err) {
    console.error('Encryption error:', err);
    return text;
  }
}

function decrypt(cipher) {
  if (!cipher) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(cipher.toString(), SECRET);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    // If decryption succeeds but returns empty, fallback to cipher (likely unencrypted database records)
    return decrypted || cipher;
  } catch (err) {
    // Graceful fallback for unencrypted values seed data
    return cipher;
  }
}

module.exports = { encrypt, decrypt };
