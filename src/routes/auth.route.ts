import { Router } from 'express';
import AuthController from '@controllers/auth.controller';
import { Routes } from '@interfaces/routes.interface';
import authMiddleware from '@/middlewares/auth.middleware';

class AuthRoute implements Routes {
  public path = '/';
  public router = Router();
  public authController = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}register`, this.authController.register);
    this.router.post(`${this.path}login`, this.authController.logIn);
    this.router.post(`${this.path}refresh`, this.authController.refreshAuthToken);
  }
}

export default AuthRoute;
