import { NextFunction, Request, Response } from 'express';
import { HttpException } from '@exceptions/HttpException';

const errorMiddleware = (error: any, req: Request, res: Response, next: NextFunction) => {
  try {
    if (error instanceof HttpException) {
      res.status(error.status).json(error.message);
    } else {
      console.error(`[${req.method}] ${req.path} >> SERVER SIDE ERROR`, error);
      res.status(500).json('Something went wrong');
    }
  } catch (error) {
    next(error);
  }
};

export default errorMiddleware;
