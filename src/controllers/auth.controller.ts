import { NextFunction, Request, Response } from 'express';
import { User } from '@prisma/client';
import { RequestWithUser } from '@interfaces/auth.interface';
import AuthService from '@services/auth.service';
import { Controller } from '../Controller';
import { HttpException } from '@/exceptions/HttpException';

class AuthController extends Controller {
  public authService = new AuthService();

  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid, displayName } = req.body;
      if (uid == null || displayName == null) {
        throw HttpException.MISSING_PARAMETER;
      }

      const createUserData: User = await this.authService.register(uid, displayName);

      res.status(201).json(createUserData);
    } catch (error) {
      this.handleError(error, res, next);
    }
  };

  public logIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.body;
      if (uid == null) {
        throw HttpException.MISSING_PARAMETER;
      }

      const { cookie, findUser } = await this.authService.login(uid);

      res.setHeader('Set-Cookie', [cookie]);
      res.status(200).json(findUser);
    } catch (error) {
      this.handleError(error, res, next);
    }
  };

  public logOut = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.setHeader('Set-Cookie', ['Authorization=; Max-age=0']);
      res.status(200).json('User logged out');
    } catch (error) {
      this.handleError(error, res, next);
    }
  };
}

export default AuthController;
