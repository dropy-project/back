import { Router } from 'express';
import AuthController from '@controllers/auth.controller';
import { Routes } from '@interfaces/routes.interface';
import errorMiddleware from '@/middlewares/error.middleware';

class AuthRoute implements Routes {
  public path = '/';
  public router = Router();
  public authController = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}register`, this.authController.register, errorMiddleware);
    this.router.post(`${this.path}login`, this.authController.logIn, errorMiddleware);
    this.router.post(`${this.path}refresh`, this.authController.refreshAuthToken, errorMiddleware);
  }
}

export default AuthRoute;
