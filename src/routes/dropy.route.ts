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
    this.router.post(`${this.path}/add/:id/media`, authMiddleware, this.dropyController.createDropyMedia);
    this.router.post(`${this.path}/findAround`, authMiddleware, this.dropyController.findAround);
    this.router.post(`${this.path}/retrieve`, authMiddleware, this.dropyController.retrieveDropy);
    this.router.get(`${this.path}/:id/media`, authMiddleware, this.dropyController.getDropyMedia);
    this.router.get(`${this.path}/:id`, authMiddleware, this.dropyController.getDropy);
  }
}

export default DropyRoute;
