import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import DropyController from '@/controllers/dropy.controller';
import errorMiddleware from '@/middlewares/error.middleware';

class DropyRoute implements Routes {
  public path = '/dropy';
  public router = Router();
  public dropyController = new DropyController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/add`, authMiddleware, this.dropyController.createDropy, errorMiddleware);
    this.router.post(`${this.path}/add/:id/media`, authMiddleware, this.dropyController.createDropyMedia, errorMiddleware);
    this.router.post(`${this.path}/findAround`, authMiddleware, this.dropyController.findAround, errorMiddleware);
    this.router.post(`${this.path}/retrieve`, authMiddleware, this.dropyController.retrieveDropy, errorMiddleware);
    this.router.get(`${this.path}/:id/media`, authMiddleware, this.dropyController.getDropyMedia, errorMiddleware);
    this.router.get(`${this.path}/:id`, authMiddleware, this.dropyController.getDropy, errorMiddleware);
  }
}

export default DropyRoute;
