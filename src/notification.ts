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

export async function sendPushNotification(notification: Notification): Promise<Result[]> {
  if (notification.user == undefined) {
    return;
  }
  if (notification.user.deviceToken == undefined) {
    return;
  }
  try {
    return await push.send(notification.user.deviceToken, {
      topic: 'com.dropy.project',
      title: notification.title,
      body: notification.body,
      sound: notification.sound ?? 'default',
      badge: notification.user.notificationBadgeCount,
      contentAvailable: true,
      clickAction: notification.payload ? JSON.stringify(notification.payload) : undefined,
    });
  } catch (error) {
    console.error('PUSH NOTIFICATION ERROR', error, {
      production: process.env.NODE_ENV === 'production',
      apnKey: apnKey != undefined,
      apnKeyId: process.env.APN_KEYID != undefined,
      apnTeamId: process.env.APN_TEAMID != undefined,
      fcmKey: process.env.FCM_KEY != undefined,
    });
  }
}
