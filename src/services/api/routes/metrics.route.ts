import { Router } from 'express';
import authMiddleware from '@middlewares/auth.middleware';
import errorMiddleware from '@middlewares/error.middleware';
import * as metricsController from '@services/api/controllers/metrics.controller';

const path = '/metrics';

export function getRouter() {
  const router = Router();

  router.get(`${path}/API`, metricsController.API, errorMiddleware);

  return router;
}
