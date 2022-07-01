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

      const authData = await this.authService.login(uid);

      res.status(200).json(authData);
    } catch (error) {
      next(error);
    }
  };

  public refreshAuthToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      this.throwIfNotString(refreshToken);

      const { token } = await this.authService.refreshAuthToken(refreshToken);
      res.status(200).json(token);
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;
