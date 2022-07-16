import PushNotifications, { Result } from 'node-pushnotifications';
import fs from 'fs';
import { User } from '@prisma/client';

export interface Notification {
  user: User;
  title: string;
  body: string;
  payload?: any;
  sound?: 'dropy_sound.mp3' | 'message_sound.mp3';
  badge?: number;
}

export interface BatchedNotification extends Omit<Notification, 'user'> {
  users: User[];
}

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
    production: process.env.NODE_ENV === 'production',
  },
  gcm: {
    id: process.env.FCM_KEY || '',
  },
});

export async function sendPushNotification(notification: Notification | BatchedNotification): Promise<Result[]> {
  const tokens = [];

  const single = notification as Notification;
  const batched = notification as BatchedNotification;

  if (batched.users != undefined) {
    batched.users.forEach(user => {
      tokens.push(user.deviceToken);
    });
  } else if (single.user != undefined) {
    tokens.push(single.user.deviceToken);
  }

  const results = await push.send(tokens, {
    topic: 'com.dropy.project',
    title: notification.title,
    body: notification.body,
    sound: notification.sound ?? 'default',
    badge: 1,
    contentAvailable: true,
    clickAction: notification.payload ? JSON.stringify(notification.payload) : undefined,
  });
  return results;
}
