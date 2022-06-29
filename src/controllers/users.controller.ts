import { NextFunction, Response } from 'express';
import userService from '@services/users.service';
import { Controller } from '../Controller';
import { HttpException } from '@/exceptions/HttpException';
import { AuthenticatedRequest } from '@/interfaces/auth.interface';

class UsersController extends Controller {
  public userService = new userService();

  public backgroundGeolocationPing = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { location } = req.body;
      const { userId } = req.params as unknown as { userId: number };

      this.checkForNotSet(location?.coords, userId);

      const { timestamp, coords } = location;
      const { latitude, longitude } = coords;

      this.checkForNotSet(timestamp, latitude, longitude);
      this.checkForNan(timestamp, latitude, longitude);

      if (Number(userId) != req.user.id) {
        throw HttpException.INVALID_TOKEN;
      }

      await this.userService.backgroundGeolocationPing(Number(userId), longitude, latitude, timestamp);
    } catch (error) {
      next(error);
    }
  };
}

export default UsersController;
