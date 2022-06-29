import { NextFunction, Request, Response } from 'express';
import userService from '@services/users.service';
import { getUserIdFromToken } from '@/utils/auth.utils';
import { Controller } from '../Controller';
import { HttpException } from '@/exceptions/HttpException';

class UsersController extends Controller {
  public userService = new userService();

  public backgroundGeolocationPing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentPositionLongitude = req.body.coords.longitude;
      const currentPositionLatitude = req.body.coords.latitude;
      const timeStamp = new Date(req.body.timestamp);
      const userId = Number(req.params.userId);
      const currentUserId = await getUserIdFromToken(req);

      if (userId == undefined || currentUserId || currentPositionLongitude == undefined || currentPositionLatitude == undefined) {
        throw HttpException.MISSING_PARAMETER;
      }

      if (userId != currentUserId) {
        throw HttpException.INVALID_TOKEN;
      }

      await this.userService.backgroundGeolocationPing(userId, currentPositionLongitude, currentPositionLatitude, timeStamp);
    } catch (error) {
      this.handleError(error, res, next);
    }
  };
}

export default UsersController;
