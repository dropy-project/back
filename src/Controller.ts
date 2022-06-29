import { HttpException } from '@/exceptions/HttpException';
import { NextFunction, Response } from 'express';

export abstract class Controller {
  protected handleError = (error: unknown, res: Response, next: NextFunction) => {
    if (error instanceof HttpException) {
      error.send(res);
      return;
    }
    next(error);
  };
}
