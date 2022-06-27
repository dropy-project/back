import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import UsersController from '@controllers/users.controller';

class UsersRoute implements Routes {
  public path = '/user';
  public router = Router();
  public usersController = new UsersController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/:userId/backgroundGeolocationPing`, authMiddleware, this.usersController.backgroundGeolocationPing);
    this.router.post(`${this.path}/:userId/changeDeviceToken`, authMiddleware, this.usersController.changeDeviceToken);
    this.router.get(`${this.path}/:userId/sendPushNotification`, authMiddleware, this.usersController.sendPushNotification)
  }
}

export default UsersRoute;
