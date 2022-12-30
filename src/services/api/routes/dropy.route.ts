import { Router } from 'express';
import authMiddleware from '@middlewares/auth.middleware';
import errorMiddleware from '@middlewares/error.middleware';
import * as dropyController from '@services/api/controllers/dropy.controller';

const path = '/dropy';

export function getRouter() {
  const router = Router();

  router.get(`${path}/userEmitted`, authMiddleware as any, dropyController.userEmittedDropies, errorMiddleware);
  router.get(`${path}/userRetrieved`, authMiddleware as any, dropyController.userRetrievedDropies, errorMiddleware);

  router.delete(`${path}/:id`, authMiddleware as any, dropyController.deleteDropy, errorMiddleware);

  router.get(`${path}/unretrievedDropyInfos/:id`, authMiddleware as any, dropyController.getUnretrievedDropyInfos, errorMiddleware);
  router.get(`${path}/:id/media`, authMiddleware as any, dropyController.getDropyMedia, errorMiddleware);
  router.get(`${path}/:id`, authMiddleware as any, dropyController.getDropy, errorMiddleware);

  router.post(`${path}/welcomeDropy`, authMiddleware as any, dropyController.welcomeDropy, errorMiddleware);

  return router;
}
