import { Router } from 'express';
import errorMiddleware from '@/middlewares/error.middleware';
import * as authController from '@controllers/auth.controller';

const path = '/';

export function getRouter() {
  const router = Router();

  router.get(`${path}version/:serverVersion`, authController.versionCheck, errorMiddleware);
  router.post(`${path}register`, authController.register, errorMiddleware);
  router.post(`${path}login`, authController.logIn, errorMiddleware);
  router.post(`${path}refresh`, authController.refreshAuthToken, errorMiddleware);

  return router;
}
