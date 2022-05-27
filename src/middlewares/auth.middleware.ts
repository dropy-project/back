import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, RequestWithUser } from '@interfaces/auth.interface';

const authMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const Authorization = req.cookies['Authorization'] || (req.header('Authorization') ? req.header('Authorization').split('Bearer ')[1] : null);

    if (Authorization == null) {
      next(new HttpException(404, 'Authentication token missing'));
      return;
    }
    const secretKey = '';
    const verificationResponse = (await verify(Authorization, secretKey)) as DataStoredInToken;
    const userUid = verificationResponse.id;

    const users = new PrismaClient().user;
    const findUser = await users.findUnique({ where: { uid: userUid } });

    if (findUser != null) {
      req.user = findUser;
      next();
    } else {
      next(new HttpException(401, 'Wrong authentication token'));
    }
  } catch (error) {
    next(new HttpException(401, 'Authentication error'));
  }
};

export default authMiddleware;
