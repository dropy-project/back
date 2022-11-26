import { NextFunction, Request, Response } from 'express';
import { HttpException } from '@exceptions/HttpException';
import { JsonWebTokenError } from 'jsonwebtoken';
import { webhookError } from '@/utils/webhook.utils';
import { AuthenticatedRequest } from '@/interfaces/auth.interface';

const errorMiddleware = (error: any, req: Request, res: Response, next: NextFunction) => {
  try {
    if (error instanceof HttpException) {
      res.status(error.status).json(error.message);
    } else if (error instanceof JsonWebTokenError) {
      res.status(403).json(error.message);
    } else {
      console.error(`[${req.method}] ${req.path} >> SERVER SIDE ERROR`, error);
      res.status(500).json('Something went wrong');
      const user = (req as AuthenticatedRequest)?.user;
      webhookError(`PROD SIDE ERROR`, user?.username, `**[${req.method}] ${req.path}**\n\`\`\`${error}\`\`\``);
    }
  } catch (error) {
    next(error);
  }
};

export default errorMiddleware;
