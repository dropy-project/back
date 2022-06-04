import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, RequestWithUser } from '@interfaces/auth.interface';
import client from '@/client';

const authMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const Authorization = req.cookies['Authorization'] || (req.header('Authorization') ? req.header('Authorization').split('Bearer ')[1] : null);

    if (Authorization == null) {
      next(new HttpException(404, 'Authentication token missing'));
    }

    const secretKey = process.env.SECRET_KEY;
    const verificationResponse = (await verify(Authorization, secretKey)) as DataStoredInToken;
    const userId = verificationResponse.userId;

    const findUser = await client.user.findUnique({ where: { id: userId } });

    if (findUser != null) {
      req.user = findUser;
      next();
    } else {
      next(new HttpException(401, 'Wrong authentication token'));
    }
  } catch (error) {
    console.log(error);
    next(new HttpException(401, 'Authentication error'));
  }
};

export default authMiddleware;
