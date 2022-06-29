import { NextFunction, Response } from 'express';
import { HttpException } from '@exceptions/HttpException';
import { RequestWithUser } from '@interfaces/auth.interface';
import client from '@/client';
import { getUserIdFromToken } from '@/utils/auth.utils';

const authMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromToken(req);

    const findUser = await client.user.findUnique({ where: { id: userId } });

    if (findUser != null) {
      req.user = findUser;
      next();
    } else {
      res.status(HttpException.INVALID_TOKEN.status).send(HttpException.INVALID_TOKEN.message);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send('Authentication error');
  }
};

export default authMiddleware;
