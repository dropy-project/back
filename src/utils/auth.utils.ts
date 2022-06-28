import { DataStoredInToken } from '@/interfaces/auth.interface';
import { Request } from 'express';
import { verify } from 'jsonwebtoken';

export const getUserIdFromToken = async (token: string): Promise<number> => {
  const authorizationToken = token;
  if (authorizationToken == null) {
    return null;
  }

  const secretKey = process.env.SECRET_KEY;
  const verificationResponse = (await verify(authorizationToken, secretKey)) as DataStoredInToken;

  return verificationResponse.userId;
};
