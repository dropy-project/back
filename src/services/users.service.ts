import { User } from '@prisma/client';
import { sendPushNotification } from '../notification';
import client from '@/prisma/client';
import { getAvailableDropiesAroundLocation, getDistanceFromLatLonInMeters } from '@/utils/geolocation.utils';
import { Profile, UpdatableProfileInfos, userToProfile } from '@/interfaces/user.interface';
import { HttpException } from '@/exceptions/HttpException';

const DISTANCE_FILTER_RADIUS = 50;
const TIME_FILTER_MINUTES = 60 * 24;

export async function backgroundGeolocationPing(user: User, latitude: number, longitude: number, timeStamp: Date): Promise<void> {
  const dropiesAround = await getAvailableDropiesAroundLocation(latitude, longitude, user);

  console.log();
  console.log('-------------------');
  console.log(`[BACKGROUND PING] - ${user.displayName}`);
  console.log(`${latitude} , ${longitude}`);

  const canSendNotification = await checkTimeAndDistanceBetweenNotifications(user, latitude, longitude, timeStamp);

  const nearDropies = dropiesAround.filter(dropy => {
    return getDistanceFromLatLonInMeters(latitude, longitude, dropy.latitude, dropy.longitude) <= DISTANCE_FILTER_RADIUS;
  });

  console.log(`Dropies around : ${dropiesAround.length}`);
  console.log(`Dropies around : ${nearDropies.length}`);
  console.log(`Send notification : ${canSendNotification}`);
  console.log('-------------------');

  if (nearDropies.length > 0 && canSendNotification) {
    console.log('Send notification and save into the database');
    await sendPushNotification({
      user,
      title: 'Drop found near your position!',
      body: 'Open the app to see it',
      sound: 'dropy_sound.mp3',
    });

    await client.user.update({
      where: { id: user.id },
      data: {
        lastGeolocationPingDate: timeStamp,
        lastGeolocationPingLatitude: latitude,
        lastGeolocationPingLongitude: longitude,
      },
    });
  }
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

export async function getUserProfile(userId: number): Promise<Profile> {
  const user = await client.user.findUnique({ where: { id: userId } });

  if (user == null) {
    throw new HttpException(404, `User with id ${userId} not found`);
  }

  return userToProfile(user);
}

export async function updateUserProfile(user: User, profileInfos: UpdatableProfileInfos): Promise<Profile> {
  const updatedUser = await client.user.update({
    where: { id: user.id },
    data: {
      ...profileInfos,
    },
  });
  return userToProfile(updatedUser);
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

export async function changeOnlineStatus(user: User, status: boolean): Promise<void> {
  await client.user.update({
    where: { id: user.id },
    data: {
      isOnline: status,
    },
  });
}
