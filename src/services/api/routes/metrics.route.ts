import { Router } from 'express';
import errorMiddleware from '@middlewares/error.middleware';
import * as metrics from '@services/api/services/metrics/metrics';

const path = '/metrics';

export function getRouter() {
  const router = Router();

  router.get(`${path}/API`, metrics.API, errorMiddleware);

  return router;
}
