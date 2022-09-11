import client from '@/client';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, UserTokens } from '@interfaces/auth.interface';
import { createUserToken, displayNameToUsername } from '@/utils/user.utils';
import { Profile } from '@interfaces/user.interface';
import * as userService from './users.service';
import crypto from 'crypto-js';

export async function register(displayName: string, email: string, password: string): Promise<User> {
  const findUser: User = await client.user.findUnique({ where: { email } });
  if (findUser) throw new HttpException(409, `This email is already registered`);

  const username: string = await displayNameToUsername(displayName);
  const hashedPassword = crypto.SHA256(password).toString();
  const createUserData: User = await client.user.create({
    data: {
      displayName,
      email,
      password: hashedPassword,
      username,
    },
  });
  return createUserData;
}

export async function login(email: string, password: string): Promise<UserTokens & { profile: Profile }> {
  const user: User = await client.user.findUnique({ where: { email } });
  if (!user) throw new HttpException(404, 'No user found with this email');

  const hash = crypto.SHA256(password).toString();
  if (hash !== user.password) throw new HttpException(403, 'Wrong password');

  const profile = await userService.getUserProfile(user.id);
  return { ...createUserToken(user), profile };
}

export async function refreshAuthToken(refreshToken: string): Promise<UserTokens> {
  const secretKey = process.env.REFRESH_SECRET_KEY;
  const { userId } = (await jwt.verify(refreshToken, secretKey)) as DataStoredInToken;

  const user = await client.user.findUnique({ where: { id: userId } });
  return createUserToken(user);
}
