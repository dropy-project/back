import { NextFunction, Request, Response } from 'express';
import { User } from '@prisma/client';
import userService from '@services/users.service';
import { getUserIdFromToken } from '@/utils/auth.utils';
import { sendPushNotification } from '../notification'

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

  public changeDeviceToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = await getUserIdFromToken(req);
      const { deviceToken } = req.body;
      const userIdUrl = Number(req.params.userId);

      if (currentUserId !== userIdUrl) {
        res.status(401).json('You are not authorized to change this user');
      }
      if (!deviceToken || deviceToken == undefined) {
        res.status(400).json('Device token is required');
      }

      await this.userService.changeDeviceToken(userIdUrl, deviceToken);

      res.status(200).json('Device token changed');
    } catch (error) {
      next(error);
    }
  }



  public backgroundGeolocationPing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { longitude, latitude } = req?.body?.location?.coords;
      const timeStamp = new Date(req?.body?.location?.timestamp);
      const userId = Number(req.params.userId);
      const currentUserId = await getUserIdFromToken(req);
      if (userId == undefined || currentUserId == undefined || longitude == undefined || latitude == undefined) {
        res.status(400).send('Missing parameters');
      }
      if (userId != currentUserId) {
        res.status(403).send('UserId token invalid');
      }

      await this.userService.backgroundGeolocationPing(userId, longitude, latitude, timeStamp);

      res.status(200).send('Ping sucessful')
    } catch (error) {
      next(error);
    }
  };

  public sendPushNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = await getUserIdFromToken(req);
      const userIdUrl = Number(req.params.userId);

      if (currentUserId !== userIdUrl) {
        res.status(401).json('You are not authorized to change this user');
      }

      const user = await this.userService.sendPushNotification(userIdUrl);
      let pushNotif = await sendPushNotification([user], "GIT POULE GIT POULE POUUUUUUULE");
      console.log(pushNotif[0])
      res.status(200).json("push send");
    } catch (error) {
      next(error);
    }
  };
}

export default UsersController;
