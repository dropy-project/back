import { NextFunction, Request, Response } from 'express';
import { User } from '@prisma/client';
import userService from '@services/users.service';
import { getUserIdFromToken } from '@/utils/auth.utils';

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
      const currentPositionLongitude  = req.body.coords.longitude;
      const currentPositionLatitude = req.body.coords.latitude;
      const timeStamp = new Date(req.body.timestamp);
      const userId = Number(req.params.userId);
      const currentUserId = await getUserIdFromToken(req);
      if (userId == undefined || currentUserId ||currentPositionLongitude == undefined || currentPositionLatitude == undefined) {
        res.status(400).send('Missing parameters');
        return;
      }
      if(userId != currentUserId) {
        res.status(403).send('UserId token invalid');
        return;
      }

      await this.userService.backgroundGeolocationPing(userId, currentPositionLongitude, currentPositionLatitude,timeStamp);
    } catch (error) {
      next(error);
    }
  };
}

export default UsersController;
