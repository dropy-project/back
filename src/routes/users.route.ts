import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import UsersController from '@controllers/users.controller';

class UsersRoute implements Routes {
  public path = '/user';
  public router = Router();
  public usersController = new UsersController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() { }
}

export default UsersRoute;
