import { Dropy, User } from '@prisma/client';
import { getAvailableDropiesAroundLocation } from '@/services/dropy.service';
import { sendPushNotification } from '../notification';
import client from '@/prisma/client';
import { getDistanceFromLatLonInMeters } from '@/utils/notification.utils';

const DISTANCE_FILTER_RADIUS = 50;
const TIME_FILTER_MINUTES = 60 * 24;

export async function backgroundGeolocationPing(user: User, latitude: number, longitude: number, timeStamp: Date): Promise<Dropy[]> {
  const dropiesAround = await getAvailableDropiesAroundLocation(latitude, longitude, user);

  console.log();
  console.log('-------------------');
  console.log(`[BACKGROUND PING] - ${user.displayName}`);
  console.log(`${latitude} , ${longitude}`);

  const canSendNotification = await checkTimeAndDistanceBetweenNotifications(user, latitude, longitude, timeStamp);

  console.log(`Dropies around : ${dropiesAround.length}`);
  console.log(`Send notification : ${canSendNotification}`);
  console.log('-------------------');

  await client.user.update({
    where: { id: user.id },
    data: {
      lastGeolocationPingDate: timeStamp,
      lastGeolocationPingLatitude: latitude,
      lastGeolocationPingLongitude: longitude,
    },
  });

  if (dropiesAround.length > 0 && canSendNotification) {
    sendPushNotification({
      user,
      title: 'Drop found near your position!',
      body: 'Open the app to see it',
      sound: 'dropy_sound.mp3',
    });
  }

  return dropiesAround;
}

export async function checkTimeAndDistanceBetweenNotifications(user: User, latitude: number, longitude: number, timeStamp: Date): Promise<Boolean> {
  const { lastGeolocationPingDate, lastGeolocationPingLatitude, lastGeolocationPingLongitude } = user;
  if (lastGeolocationPingDate == null || lastGeolocationPingLatitude == null || lastGeolocationPingLongitude == null) return true;

  const distance = getDistanceFromLatLonInMeters(latitude, longitude, lastGeolocationPingLatitude, lastGeolocationPingLongitude);
  console.log(`Distance from last ping : ${distance}m`);

  const timeDifference = timeStamp.getTime() - lastGeolocationPingDate.getTime();
  const timeDifferenceInMinutes = timeDifference / (1000 * 60);
  console.log(`Time from last ping : ${timeDifferenceInMinutes}m`);

  return distance > DISTANCE_FILTER_RADIUS || timeDifferenceInMinutes > TIME_FILTER_MINUTES;
}

export async function updateDeviceToken(user: User, deviceToken: string): Promise<void> {
  await client.user.update({
    where: {
      id: user.id,
    },
    data: {
      deviceToken,
    },
  });
}
