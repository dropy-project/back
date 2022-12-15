import { User } from '@prisma/client';
import { sendPushNotification } from '../../../notification';
import client from '@/client';
import { findDropiesByGeohash, GEOHASH_SIZE } from '@utils/geolocation.utils';
import { NotificationsSettings, NotificationsSettingsBitValue, Profile, SimplifiedUser, UpdatableProfileInfos } from '@interfaces/user.interface';
import { HttpException } from '@/exceptions/HttpException';
import { UploadedFile } from 'express-fileupload';
import { deleteContent, uploadContent } from '@/utils/content.utils';
import { displayNameToUsername, hasNotificationsSettings } from '@/utils/user.utils';
import Geohash from 'ngeohash';

const NB_REPORTS_TO_BAN = 15;

export async function backgroundGeolocationPing(user: User, latitude: number, longitude: number): Promise<void> {
  const pingGeohash: string = Geohash.encode_int(latitude, longitude, GEOHASH_SIZE).toString();

  console.log();
  console.log('-------------------');
  console.log(`[BACKGROUND PING] - ${user.displayName}`);
  console.log(`User current geohash: ${pingGeohash}`);

  const { lastPingGeohash } = user;
  console.log(`User last geohash: ${pingGeohash}`);

  await client.user.update({
    where: { id: user.id },
    data: {
      lastPingGeohash: pingGeohash,
    },
  });

  if (lastPingGeohash === pingGeohash) {
    console.log('User has not entered a new zone');
    console.log('-------------------');
    return;
  }

  const dropiesAround = await findDropiesByGeohash(user, [pingGeohash], true);

  const canSendNotification = dropiesAround.length > 0;

  if (!canSendNotification) {
    console.log('No notification to send');
    console.log('-------------------');
    return;
  }

  console.log(`Send notification : ${canSendNotification}`);
  console.log('-------------------');

  const plural = dropiesAround.length > 1;
  const pluralSuffix = plural ? 's' : '';
  sendPushNotification({
    user,
    title: `Il y a ${dropiesAround.length} drop${pluralSuffix} à côté de toi !`,
    body: `Ouvre l'app pour ${plural ? 'les' : 'le'} voir !`,
    sound: 'dropy_sound.mp3',
  });
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
    energy: user.energy,
  };
}

export async function updateUserProfile(user: User, profileInfos: UpdatableProfileInfos): Promise<Profile> {
  let username = user.username;
  if (profileInfos.displayName !== user.displayName) {
    username = await displayNameToUsername(profileInfos.displayName);
  }

  const updatedUser = await client.user.update({
    where: { id: user.id },
    data: {
      ...profileInfos,
      username,
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
      avatarUrl: blockedUser.avatarUrl,
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

export async function deleteUser(user: User): Promise<void> {
  await client.user.update({
    where: { id: user.id },
    data: {
      isDeleted: true,
      email: `deleted${new Date()}`,
      password: 'deleted',
      username: `deleted${new Date()}`,
      displayName: 'Deleted User',
      pronouns: 'UNKNOWN',
      about: '',
      isDeveloper: false,
      isAdmin: false,
      isAmbassador: false,
      isPremium: false,
      isBanned: false,
    },
  });
}

export async function getNotificationsSettings(user: User): Promise<NotificationsSettings> {
  return {
    dailyDropyReminder: hasNotificationsSettings(user, NotificationsSettingsBitValue.DAILY_DROPY_REMINDER),
    dropyCollected: hasNotificationsSettings(user, NotificationsSettingsBitValue.DROPY_COLLECTED),
    newFeature: hasNotificationsSettings(user, NotificationsSettingsBitValue.NEW_FEATURE),
  };
}

export async function updateNotificationsSettings(user: User, settings: NotificationsSettings): Promise<void> {
  let settings_binary = 0;

  if (settings.dailyDropyReminder) settings_binary |= NotificationsSettingsBitValue.DAILY_DROPY_REMINDER;
  if (settings.dropyCollected) settings_binary |= NotificationsSettingsBitValue.DROPY_COLLECTED;
  if (settings.newFeature) settings_binary |= NotificationsSettingsBitValue.NEW_FEATURE;

  await client.user.update({
    where: { id: user.id },
    data: { notificationSettings: settings_binary },
  });
}
