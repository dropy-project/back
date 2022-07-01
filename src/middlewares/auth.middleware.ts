import client from '@/client';
import { JsonWebTokenError, verify } from 'jsonwebtoken';
import { NextFunction, Response } from 'express';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, AuthenticatedRequest } from '@interfaces/auth.interface';

import errorMiddleware from './error.middleware';

const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authorization = req.header('Authorization');

    if (authorization == null) {
      errorMiddleware(HttpException.INVALID_TOKEN, req, res, next);
      return;
    }

    const secretKey = process.env.SECRET_KEY;
    const { userId } = (await verify(authorization, secretKey)) as DataStoredInToken;

    const user = await client.user.findUnique({ where: { id: userId } });

    if (user == null) {
      errorMiddleware(HttpException.INVALID_TOKEN, req, res, next);
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      errorMiddleware(HttpException.INVALID_TOKEN, req, res, next);
    } else {
      errorMiddleware(error, req, res, next);
    }
  }
};

export default authMiddleware;
