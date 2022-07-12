import { Dropy, User } from '@prisma/client';
import { getAvailableDropiesAroundLocation } from '@/services/dropy.service';
import { sendPushNotification } from '../notification';
import client from '@/prisma/client';
import { UserConversation } from '@/interfaces/chat.interface';
import { getDistanceFromLatLonInMeters } from '@/utils/notification.utils';

const DISTANCE_FILTER_RADIUS = 50;
const TIME_FILTER_MINUTES = 60 * 24;

export async function backgroundGeolocationPing(user: User, latitude: number, longitude: number, timeStamp: Date): Promise<Dropy[]> {
  const dropies = await getAvailableDropiesAroundLocation(latitude, longitude, user);
  const sendNotification = await checkTimeAndDistanceBetweenNotifications(user, latitude, longitude, timeStamp);
  await client.user.update({
    where: {
      id: user.id,
    },
    data: {
      lastGeolocationPingDate: timeStamp,
      lastGeolocationPingLatitude: latitude,
      lastGeolocationPingLongitude: longitude,
    },
  });

  if (dropies.length > 0 && sendNotification) {
    sendPushNotification({
      user,
      title: 'Drop found near your position!',
      body: 'Open the app to see it',
      sound: 'dropy_sound.mp3',
    });
  }

  return dropies;
}

export async function checkTimeAndDistanceBetweenNotifications(user: User, latitude: number, longitude: number, timeStamp: Date): Promise<Boolean> {
  const { lastGeolocationPingDate, lastGeolocationPingLatitude, lastGeolocationPingLongitude } = user;
  if (lastGeolocationPingDate == null || lastGeolocationPingLatitude == null || lastGeolocationPingLongitude == null) return true;
  const distance = getDistanceFromLatLonInMeters(latitude, longitude, lastGeolocationPingLatitude, lastGeolocationPingLongitude);
  const timeDifference = timeStamp.getTime() - lastGeolocationPingDate.getTime();
  const timeDifferenceInMinutes = timeDifference / (1000 * 60);
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
