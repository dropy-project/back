import client from '@/client';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInResetPasswordToken, DataStoredInToken, UserTokens } from '@interfaces/auth.interface';
import { createUserToken, displayNameToUsername } from '@/utils/user.utils';
import { Profile } from '@interfaces/user.interface';
import * as userService from './users.service';
import crypto from 'crypto-js';
import { createResetPasswordToken } from '@/utils/auth.utils';

export async function register(
  displayName: string,
  email: string,
  password: string,
  newsLetter: boolean,
): Promise<UserTokens & { profile: Profile }> {
  const findUser: User = await client.user.findUnique({ where: { email } });
  if (findUser) throw new HttpException(409, `This email is already registered`);

  const username: string = await displayNameToUsername(displayName);
  const hashedPassword = crypto.SHA256(password).toString();

  const createdUser = await client.user.create({
    data: {
      displayName,
      email,
      password: hashedPassword,
      username,
      newsLetter,
    },
  });

  const profile = await userService.getUserProfile(createdUser.id);
  return { ...createUserToken(createdUser), profile };
}

export async function login(email: string, password: string): Promise<UserTokens & { profile: Profile }> {
  const user: User = await client.user.findUnique({ where: { email } });
  if (!user) throw new HttpException(404, 'No user found with this email');

  if (user.isDeleted) throw new HttpException(403, 'User deleted');

  const hash = crypto.SHA256(password).toString();
  if (hash !== user.password) throw new HttpException(403, 'Wrong password');

  await client.user.update({
    where: { id: user.id },
    data: { lastLoginDate: new Date() },
  });

  const profile = await userService.getUserProfile(user.id);
  return { ...createUserToken(user), profile };
}

export async function refreshAuthToken(refreshToken: string): Promise<UserTokens> {
  const secretKey = process.env.REFRESH_SECRET_KEY;
  const { userId } = (await jwt.verify(refreshToken, secretKey)) as DataStoredInToken;

  const user = await client.user.findUnique({ where: { id: userId } });
  return createUserToken(user);
}

export async function emailAvailable(email: string): Promise<boolean> {
  const user = await client.user.findUnique({ where: { email } });
  return user == null;
}

export async function requestResetPassword(email: string): Promise<string> {
  const user = await client.user.findUnique({ where: { email } });
  if (!user) throw new HttpException(404, 'No user found with this email');

  return createResetPasswordToken(user);
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const secretKey = process.env.RESET_PASSWORD_SECRET_KEY;
  const { userId } = (await jwt.verify(token, secretKey)) as DataStoredInResetPasswordToken;

  const user = await client.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpException(404, 'No user found with this id');

  const hashedPassword = crypto.SHA256(password).toString();

  await client.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });
}
