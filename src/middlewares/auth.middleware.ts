import client from '@/client';
import { JsonWebTokenError, verify } from 'jsonwebtoken';
import { NextFunction, Response } from 'express';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, AuthenticatedRequest, AuthenticatedSocket } from '@/interfaces/auth.interface';

import errorMiddleware from './error.middleware';
import { Socket } from 'socket.io';

const authMiddleware = async (req: AuthenticatedRequest | AuthenticatedSocket, res: Response | null, next: NextFunction) => {
  const isSocket = req instanceof Socket;
  try {
    let authorization = null;
    if (isSocket) {
      authorization = req.handshake.headers.authorization;
    } else {
      authorization = req.header('Authorization').replace('Bearer ', '');
    }

    if (authorization == null) {
      if (!isSocket) errorMiddleware(HttpException.INVALID_TOKEN, req, res, next);
      return;
    }

    const secretKey = process.env.ACCESS_SECRET_KEY;
    const { userId } = (await verify(authorization, secretKey)) as DataStoredInToken;

    const user = await client.user.findUnique({ where: { id: userId } });

    if (user == null) {
      if (!isSocket) errorMiddleware(HttpException.INVALID_TOKEN, req, res, next);
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      if (isSocket) {
        return;
      }
      errorMiddleware(HttpException.INVALID_TOKEN, req, res, next);
    } else {
      if (isSocket) {
        console.error(`[Socket authentication] >> SERVER SIDE ERROR`, error);
        return;
      }
      errorMiddleware(error, req, res, next);
    }
  }
};

export default authMiddleware;
