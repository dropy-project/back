import PushNotifications from 'node-pushnotifications'
import fs from 'fs'
import { User } from '@prisma/client';

let apnKey;
if (fs.existsSync('./certNotification.p8')) {
    apnKey = fs.readFileSync('./certNotification.p8')
}

const settings = {
    apn: {
        key: apnKey,
        keyId: process.env.APN_KEYID || '',
        teamId: process.env.APN_TEAMID || '',
    },
    gcm: {
        id: process.env.FCM_KEY || '',
    }
}

const push = new PushNotifications(settings);

export function sendPushNotification(users: User[], data: any) {

    let deviceTokens = []

    for (let user of users) {
        deviceTokens.push(user.deviceToken)
    }

    const sentData = {
        topic: 'com.dropy.app',
        contentAvailable: true,
        ...data
    }
    return new Promise((resolve, reject) => {
        push.send(deviceTokens, sentData).then(resolve).catch(reject);
    });
}
