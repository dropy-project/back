import { User } from '@prisma/client';
import { sendPushNotification } from '../../../notification';
import client from '@/client';
import { getAvailableDropiesAroundLocation, getDistanceFromLatLonInMeters } from '@utils/geolocation.utils';
import { Profile, SimplifiedUser, UpdatableProfileInfos } from '@interfaces/user.interface';
import { HttpException } from '@/exceptions/HttpException';
import { UploadedFile } from 'express-fileupload';
import { deleteContent, uploadContent } from '@/utils/content.utils';

const DISTANCE_FILTER_RADIUS = 50;
const TIME_FILTER_MINUTES = 60 * 24;
const NB_REPORTS_TO_BAN = 15;

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

  return await userToProfile(user);
}

export async function userToProfile(user: User): Promise<Profile> {
  const emittedDropiesCount = await client.dropy.count({ where: { emitterId: user.id } });
  const retrievedDropiesCount = await client.dropy.count({ where: { retrieverId: user.id } });

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    registerDate: user.registerDate,
    isOnline: user.isOnline,
    about: user.about,
    pronouns: user.pronouns,
    avatarUrl: user.avatarUrl,
    emittedDropiesCount,
    retrievedDropiesCount,
    isAdmin: user.isAdmin,
    isAmbassador: user.isAmbassador,
    isBanned: user.isBanned,
    isDeveloper: user.isDeveloper,
    isPremium: user.isPremium,
  };
}

export async function updateUserProfile(user: User, profileInfos: UpdatableProfileInfos): Promise<Profile> {
  const updatedUser = await client.user.update({
    where: { id: user.id },
    data: {
      ...profileInfos,
    },
  });
  return await userToProfile(updatedUser);
}

export async function updateProfilePicture(user: User, file: UploadedFile, Authorization: string): Promise<string> {
  if (user.avatarUrl != null) {
    deleteContent(user.avatarUrl, Authorization);
  }

  const { fileUrl } = await uploadContent(file, Authorization);

  await client.user.update({
    where: { id: user.id },
    data: { avatarUrl: fileUrl },
  });

  return fileUrl;
}

export async function deleteProfilePicture(user: User, Authorization: string): Promise<void> {
  await client.user.update({
    where: { id: user.id },
    data: {
      avatarUrl: null,
    },
  });

  if (user.avatarUrl != null) {
    deleteContent(user.avatarUrl, Authorization);
  }
}

export async function getProfilePicture(userId: number): Promise<string> {
  const user = await client.user.findUnique({ where: { id: userId } });

  if (user == null) {
    throw new HttpException(404, `User with id ${userId} not found`);
  }

  return user.avatarUrl;
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

export async function reportUser(reportedId: number, sender: User, dropyId: number | undefined): Promise<void> {
  const userToReport = await client.user.findUnique({ where: { id: reportedId } });

  if (userToReport == null) {
    throw new HttpException(404, `User with id ${reportedId} not found`);
  }

  const lastHourReportsCount = await client.report.count({
    where: {
      senderId: sender.id,
      reportedId: reportedId,
      date: {
        gte: new Date(new Date().getTime() - 3600 * 1000),
      },
    },
  });

  if (lastHourReportsCount > 0) {
    throw new HttpException(401, `You can't report this user more than once per hour`);
  }

  await client.report.create({
    data: {
      senderId: sender.id,
      reportedId,
      dropyId: dropyId,
    },
  });

  const nbReports = await client.report.count({
    where: { reportedId },
  });

  if (nbReports >= NB_REPORTS_TO_BAN) {
    await client.user.update({
      where: { id: reportedId },
      data: {
        isBanned: true,
      },
    });
  }
}

export async function blockUser(blockedId: number, sender: User): Promise<void> {
  const userToBlock = await client.user.findUnique({ where: { id: blockedId } });

  if (userToBlock == null) {
    throw new HttpException(404, `User with id ${userToBlock} not found`);
  }

  await client.user.update({
    where: { id: sender.id },
    data: {
      blockedUsers: {
        connect: {
          id: blockedId,
        },
      },
    },
  });

  await client.chatConversation.updateMany({
    where: {
      AND: [
        {
          users: {
            some: { id: blockedId },
          },
        },
        {
          users: {
            some: { id: sender.id },
          },
        },
      ],
    },
    data: { closed: true },
  });
}

export async function getBlockedUsers(user: User): Promise<SimplifiedUser[]> {
  const userWithBlockedUsers = await client.user.findUnique({
    where: { id: user.id },
    include: { blockedUsers: true },
  });

  const blockedProfiles = await userWithBlockedUsers.blockedUsers.map(blockedUser => {
    return {
      id: blockedUser.id,
      username: blockedUser.username,
      displayName: blockedUser.displayName,
    };
  });

  return blockedProfiles;
}

export async function unblockUser(unblockedId: number, sender: User): Promise<void> {
  const userToUnblock = await client.user.findUnique({ where: { id: unblockedId } });

  if (userToUnblock == null) {
    throw new HttpException(404, `User with id ${unblockedId} not found`);
  }

  await client.user.update({
    where: { id: sender.id },
    data: {
      blockedUsers: {
        disconnect: {
          id: unblockedId,
        },
      },
    },
  });
}
