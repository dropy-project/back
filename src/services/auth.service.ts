import client from '@/prisma/client';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, UserTokens } from '@interfaces/auth.interface';
import { displayNameToUsername } from '@/utils/user.utils';

const ONE_DAY_IN_SECONDS = 24 * 60 * 60;
const ONE_MONTH_IN_SECONDS = 30 * 24 * 60 * 60;

export async function register(uid, displayName): Promise<User> {
  const findUser: User = await client.user.findUnique({ where: { uid: uid } });
  if (findUser) throw new HttpException(409, `This uid is already registered`);

  const username: string = await displayNameToUsername(displayName);
  const createUserData: User = await client.user.create({ data: { displayName, uid, username } });
  return createUserData;
}

export async function login(uid: string) {
  const user: User = await client.user.findUnique({ where: { uid } });
  if (!user) throw new HttpException(409, 'No user found with this uid');

  return { ...createUserToken(user), user };
}

export async function refreshAuthToken(refreshToken: string) {
  const secretKey = process.env.SECRET_KEY;
  const { userId } = (await jwt.verify(refreshToken, secretKey)) as DataStoredInToken;

  const user = await client.user.findUnique({ where: { id: userId } });
  return createUserToken(user);
}

function createUserToken(user: User): UserTokens {
  const dataStoredInToken: DataStoredInToken = { userId: user.id };
  const secretKey = process.env.SECRET_KEY;

  const accessToken = jwt.sign(dataStoredInToken, secretKey, { expiresIn: ONE_DAY_IN_SECONDS });
  const refreshToken = jwt.sign(dataStoredInToken, secretKey, { expiresIn: ONE_MONTH_IN_SECONDS });

  return {
    accessToken,
    refreshToken,
    expires: ONE_DAY_IN_SECONDS,
  };
}
