import crypto from 'crypto-js';

export const encryptMessage = (text: string) => {
  return crypto.AES.encrypt(text, process.env.CHAT_ENCRYPTION_SECRET_KEY).toString();
};

export const decryptMessage = (text: string) => {
  return crypto.AES.decrypt(text, process.env.CHAT_ENCRYPTION_SECRET_KEY).toString(crypto.enc.Utf8);
};
