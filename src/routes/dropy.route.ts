import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import DropyController from '@/controllers/dropy.controller';

class DropyRoute implements Routes {
  public path = '/dropy';
  public router = Router();
  public dropyController = new DropyController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/add`, authMiddleware, this.dropyController.createDropy);
    this.router.get(`${this.path}/all`, authMiddleware, this.dropyController.getDropies);
  }
}

export default DropyRoute;
