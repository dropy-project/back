import { Router } from 'express';
import * as usersController from '@controllers/users.controller';
import errorMiddleware from '@/middlewares/error.middleware';
import authMiddleware from '@/middlewares/auth.middleware';

const path = '/user';

export function getRouter() {
  const router = Router();

  router.post(`${path}/updateDeviceToken`, authMiddleware as any, usersController.updateDeviceToken, errorMiddleware);
  router.post(`${path}/backgroundGeolocationPing`, authMiddleware as any, usersController.backgroundGeolocationPing, errorMiddleware);
  router.get(`${this.path}/conversations`, authMiddleware as any, usersController.conversations, errorMiddleware);

  return router;
}
