import { DataStoredInResetPasswordToken } from '@/interfaces/auth.interface';
import { User } from '@prisma/client';
import jwt from 'jsonwebtoken';

const FIFTEEN_MINUTES_IN_SECONDS = 15 * 60;

export function isVersionSuperiorOrEqual(version: string, minimumVersion: string): boolean {
  const versionArray = version.split('.');
  const minimumVersionArray = minimumVersion.split('.');

  if (versionArray.length !== minimumVersionArray.length) {
    throw new Error('Version and minimum version must have the same length');
  }

  for (let i = 0; i < versionArray.length; i++) {
    const versionNumber = parseInt(versionArray[i]);
    const minimumVersionNumber = parseInt(minimumVersionArray[i]);

    if (versionNumber > minimumVersionNumber) {
      return true;
    } else if (versionNumber < minimumVersionNumber) {
      return false;
    }
  }

  return true;
}

export function createResetPasswordToken(user: User): string {
  const dataStoredInToken: DataStoredInResetPasswordToken = {
    userId: user.id,
    avatarUrl: user.avatarUrl,
    username: user.username,
    displayName: user.displayName,
  };

  const resetPasswordKey = process.env.RESET_PASSWORD_SECRET_KEY;

  const resetPasswordToken = jwt.sign(dataStoredInToken, resetPasswordKey, { expiresIn: FIFTEEN_MINUTES_IN_SECONDS });

  return resetPasswordToken;
}
