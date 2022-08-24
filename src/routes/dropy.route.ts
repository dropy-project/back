import { Router } from 'express';
import authMiddleware from '@/middlewares/auth.middleware';
import errorMiddleware from '@/middlewares/error.middleware';
import * as dropyController from '@controllers/dropy.controller';

const path = '/dropy';

export function getRouter() {
  const router = Router();

  router.get(`${path}/userEmitted`, authMiddleware as any, dropyController.userEmittedDropies, errorMiddleware);
  router.delete(`${path}/:id`, authMiddleware as any, dropyController.deleteDropy, errorMiddleware);

  router.post(`${path}/add/:id/media`, authMiddleware as any, dropyController.createDropyMedia, errorMiddleware);
  router.get(`${path}/:id/media`, authMiddleware as any, dropyController.getDropyMedia, errorMiddleware);
  router.get(`${path}/:id`, authMiddleware as any, dropyController.getDropy, errorMiddleware);

  return router;
}
