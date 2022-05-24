import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import UsersController from '@controllers/users.controller';
import authMiddleware from '@/middlewares/auth.middleware';

class UsersRoute implements Routes {
  public path = '/user';
  public router = Router();
  public usersController = new UsersController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/:uid`, authMiddleware, this.usersController.getUserbyUID);
  }
}

export default UsersRoute;
