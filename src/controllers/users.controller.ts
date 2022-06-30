import { NextFunction, Response } from 'express';
import userService from '@services/users.service';
import { Controller } from '../Controller';
import { AuthenticatedRequest } from '@/interfaces/auth.interface';

class UsersController extends Controller {
  public userService = new userService();

  public updateDeviceToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { deviceToken } = req.body;
      this.throwIfNotString(deviceToken);

      await this.userService.updateDeviceToken(req.user, deviceToken);

      res.status(200).json('Device token changed');
    } catch (error) {
      next(error);
    }
  };

  public backgroundGeolocationPing = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { location } = req.body;

      this.throwIfNull(location?.coords, req.user);

      const { timestamp, coords } = location;
      const { latitude, longitude } = coords;

      this.throwIfNotString(timestamp);
      this.throwIfNotNumber(latitude, longitude);

      await this.userService.backgroundGeolocationPing(req.user, latitude, longitude, new Date(timestamp));
      res.status(200).json('Success');
    } catch (error) {
      next(error);
    }
  };
}

export default UsersController;
