import { NextFunction, Request, Response } from 'express';
import { User } from '@prisma/client';
import userService from '@services/users.service';

class UsersController {
  public userService = new userService();

  public getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const findAllUsersData: User[] = await this.userService.findAllUser();

      res.status(200).json(findAllUsersData);
    } catch (error) {
      next(error);
    }
  };

  public getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = Number(req.params.id);
      const findOneUserData: User = await this.userService.findUserById(userId);

      res.status(200).json(findOneUserData);
    } catch (error) {
      next(error);
    }
  };

  public getUserbyUID = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userUID = req.params.uid;
      const findOneUserData: User = await this.userService.findUserByUID(userUID);

      res.status(200).json(findOneUserData);
    } catch (error) {
      next(error);
    }
  };
}

export default UsersController;
