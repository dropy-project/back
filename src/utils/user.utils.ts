import jwt from 'jsonwebtoken';
import client from '@/client';

import { DataStoredInToken, UserTokens } from '@/interfaces/auth.interface';
import { User } from '@prisma/client';
import { NotificationsSettingsBitValue } from '@/interfaces/user.interface';

const ONE_DAY_IN_SECONDS = 24 * 60 * 60;
const ONE_MONTH_IN_SECONDS = 30 * 24 * 60 * 60;

export async function displayNameToUsername(displayName: string): Promise<string> {
  const username: string = displayName.toLowerCase().trim().normalize('NFD');
  const cleanedUsername = username
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s/g, '_')
    .replace(/[^\w\s]/gi, '');

  let count = 0;
  let uniqueUsername = cleanedUsername;
  while (await client.user.findUnique({ where: { username: uniqueUsername } })) {
    uniqueUsername = username + count.toString();
    count++;
  }
  return uniqueUsername;
}

export function createUserToken(user: User): UserTokens {
  const dataStoredInToken: DataStoredInToken = { userId: user.id };
  const accessKey = process.env.ACCESS_SECRET_KEY;
  const refreshKey = process.env.REFRESH_SECRET_KEY;

  const accessToken = jwt.sign(dataStoredInToken, accessKey, { expiresIn: ONE_DAY_IN_SECONDS });
  const refreshToken = jwt.sign(dataStoredInToken, refreshKey, { expiresIn: ONE_MONTH_IN_SECONDS });

  return {
    accessToken,
    refreshToken,
    expires: ONE_DAY_IN_SECONDS,
  };
}

export function hasNotificationsSettings(user: User, value: NotificationsSettingsBitValue): boolean {
  return (user.notificationSettings & value) > 0;
}
