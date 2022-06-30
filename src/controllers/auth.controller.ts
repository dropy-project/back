import { NextFunction, Request, Response } from 'express';
import { User } from '@prisma/client';
import AuthService from '@services/auth.service';
import { Controller } from '../Controller';

class AuthController extends Controller {
  public authService = new AuthService();

  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid, displayName } = req.body;
      this.throwIfNotString(uid, displayName);

      const createUserData: User = await this.authService.register(uid, displayName);

      res.status(201).json(createUserData);
    } catch (error) {
      next(error);
    }
  };

  public logIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uid } = req.body;
      this.throwIfNotString(uid);

      const { cookie, user } = await this.authService.login(uid);

      res.setHeader('Set-Cookie', [cookie]);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;
