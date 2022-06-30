import PushNotifications from 'node-pushnotifications';
import fs from 'fs';
import { User } from '@prisma/client';

let apnKey;
if (fs.existsSync('./certNotification.p8')) {
  apnKey = fs.readFileSync('./certNotification.p8');
} else {
  console.error('Missing apple notification certificate file');
}

const push = new PushNotifications({
  apn: {
    token: {
      key: apnKey,
      keyId: process.env.APN_KEYID || '',
      teamId: process.env.APN_TEAMID || '',
    },
    production: false,
  },
  gcm: {
    id: process.env.FCM_KEY || '',
  },
});

export async function sendPushNotificationToUsers(users: User[], body: string) {
  const tokens = users.filter(user => user.deviceToken != null).map(user => user.deviceToken);
  return await sendPushNotifications(tokens, body);
}

export async function sendPushNotifications(tokens: string[], body: string) {
  return await push.send(tokens, {
    topic: 'com.dropy.project',
    title: 'Dropy',
    body,
    sound: 'default',
    contentAvailable: true,
  });
}
