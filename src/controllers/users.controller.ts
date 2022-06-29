import { NextFunction, Request, Response } from 'express';
import userService from '@services/users.service';
import { getUserIdFromToken } from '@/utils/auth.utils';
import { Controller } from '../Controller';
import { HttpException } from '@/exceptions/HttpException';

class UsersController extends Controller {
  public userService = new userService();

  public backgroundGeolocationPing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { location } = req.body;
      const { userId } = req.params as unknown as { userId: number };

      this.checkForNotSet(location?.coords, userId);

      const { timestamp, coords } = location;
      const { latitude, longitude } = coords;

      this.checkForNotSet(timestamp, latitude, longitude);
      this.checkForNan(timestamp, latitude, longitude);

      const tokenUserId = await getUserIdFromToken(req);

      if (Number(userId) != tokenUserId) {
        throw HttpException.INVALID_TOKEN;
      }

      await this.userService.backgroundGeolocationPing(Number(userId), longitude, latitude, timestamp);
    } catch (error) {
      next(error);
    }
  };
}

export default UsersController;
