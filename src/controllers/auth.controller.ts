import { NextFunction, Request, Response } from 'express';
import { User } from '@prisma/client';
import { UserAuthDTO } from '@dtos/users.dto';
import { RequestWithUser } from '@interfaces/auth.interface';
import AuthService from '@services/auth.service';

class AuthController {
  public authService = new AuthService();

  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: UserAuthDTO = req.body;
      const createUserData: User = await this.authService.register(userData);

      res.status(201).json(createUserData);
    } catch (error) {
      next(error);
    }
  };

  public logIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: UserAuthDTO = req.body;
      const { cookie, findUser } = await this.authService.login(userData);

      res.setHeader('Set-Cookie', [cookie]);
      res.status(200).json(findUser);
    } catch (error) {
      next(error);
    }
  };

  public logOut = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.setHeader('Set-Cookie', ['Authorization=; Max-age=0']);
      res.status(200).json('User loged out');
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;
