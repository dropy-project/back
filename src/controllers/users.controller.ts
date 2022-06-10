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

  public backgroundGeolocationPing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, currentPositionLongitude, currentPositionLatitude } = req.body;
      if (userId == undefined || currentPositionLongitude == undefined || currentPositionLatitude == undefined) {
        res.status(400).send('Missing parameters');
        return;
      }
      await this.userService.backgroundGeolocationPing(userId, currentPositionLongitude, currentPositionLatitude);
    } catch (error) {
      next(error);
    }
  };
}

export default UsersController;
