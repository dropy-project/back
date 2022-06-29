import { NextFunction, Response } from 'express';
import userService from '@services/users.service';
import { Controller } from '../Controller';
import { AuthenticatedRequest } from '@/interfaces/auth.interface';

class UsersController extends Controller {
  public userService = new userService();

  public backgroundGeolocationPing = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { location } = req.body;

      this.checkForNotSet(location?.coords, req.user);

      const { timestamp, coords } = location;
      const { latitude, longitude } = coords;

      this.checkForNotSet(timestamp, latitude, longitude);
      this.checkForNan(latitude, longitude);

      await this.userService.backgroundGeolocationPing(req.user.id, longitude, latitude, new Date(timestamp));
      res.status(200).json('Success');
    } catch (error) {
      next(error);
    }
  };
}

export default UsersController;
