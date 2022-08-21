import client from '@/prisma/client';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, UserTokens } from '@interfaces/auth.interface';
import { createUserToken, displayNameToUsername } from '@/utils/user.utils';
import { Profile } from '@/interfaces/user.interface';
import * as userService from './users.service';

export async function register(uid: string, displayName: string): Promise<User> {
  const findUser: User = await client.user.findUnique({ where: { uid: uid } });
  if (findUser) throw new HttpException(409, `This uid is already registered`);

  const username: string = await displayNameToUsername(displayName);
  const createUserData: User = await client.user.create({ data: { displayName, uid, username } });
  return createUserData;
}

export async function login(uid: string): Promise<UserTokens & { profile: Profile }> {
  const user: User = await client.user.findUnique({ where: { uid } });
  if (!user) throw new HttpException(409, 'No user found with this uid');

  const profile = await userService.getUserProfile(user.id);
  return { ...createUserToken(user), profile };
}

export async function refreshAuthToken(refreshToken: string): Promise<UserTokens> {
  const secretKey = process.env.REFRESH_SECRET_KEY;
  const { userId } = (await jwt.verify(refreshToken, secretKey)) as DataStoredInToken;

  const user = await client.user.findUnique({ where: { id: userId } });
  return createUserToken(user);
}
