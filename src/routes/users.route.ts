import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import UsersController from '@controllers/users.controller';
import errorMiddleware from '@/middlewares/error.middleware';

class UsersRoute implements Routes {
  public path = '/user';
  public router = Router();
  public usersController = new UsersController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/backgroundGeolocationPing`, authMiddleware, this.usersController.backgroundGeolocationPing, errorMiddleware);
  }
}

export default UsersRoute;
