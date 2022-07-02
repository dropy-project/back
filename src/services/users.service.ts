import { Dropy, User } from '@prisma/client';
import { getAvailableDropiesAroundLocation } from '@/services/dropy.service';
import { sendPushNotificationToUsers } from '../notification';
import client from '@/client';

export async function backgroundGeolocationPing(user: User, latitude: number, longitude: number, timeStamp: Date): Promise<Dropy[]> {
  const dropies = await getAvailableDropiesAroundLocation(latitude, longitude, user);
  await client.user.update({
    where: {
      id: user.id,
    },
    data: {
      lastSeenDate: timeStamp,
      lastSeenLocationLatitude: latitude,
      lastSeenLocationLongitude: longitude,
    },
  });

  if (dropies.length > 0) {
    sendPushNotificationToUsers([user], 'Drop found near your position');
  }

  return dropies;
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
