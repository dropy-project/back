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
      let tokenObject = {authorizationToken : cookie[0],refreshToken : cookie[1] ,  user : findUser};
      res.status(200).json(tokenObject);
    } catch (error) {
      next(error);
    }
  };

  public refreshAuthToken = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = await this.authService.refreshAuthToken(req);
      const tokenasjson = {"authorizationToken":token}
      res.status(200).json(tokenasjson);
    } catch(error) {
      next(error);
    }
  };
}

export default AuthController;
