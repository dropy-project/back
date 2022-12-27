import { Router } from 'express';
import errorMiddleware from '@/middlewares/error.middleware';
import * as authController from '@services/api/controllers/auth.controller';
import * as swaggerUi from 'swagger-ui-express';
import * as swaggerDocument from 'resources/swagger/routesDoc.json';

const path = '/';

export function getRouter() {
  const router = Router();

  router.get(`${path}version/:serverVersion`, authController.versionCheck, errorMiddleware);
  router.post(`${path}register`, authController.register, errorMiddleware);
  router.post(`${path}login`, authController.logIn, errorMiddleware);
  router.post(`${path}refresh`, authController.refreshAuthToken, errorMiddleware);

  router.get(`${path}emailAvailable/:email`, authController.emailAvailable, errorMiddleware);

  router.post(`${path}requestResetPassword`, authController.requestResetPassword, errorMiddleware);
  router.post(`${path}resetPassword`, authController.resetPassword, errorMiddleware);

  if (process.env.NODE_ENV != 'production') {
    router.use('/api-docs', swaggerUi.serve);
    router.get('/api-docs', swaggerUi.setup(swaggerDocument));
  }

  return router;
}
