import { Router } from 'express';
import errorMiddleware from '@/middlewares/error.middleware';

import * as contentController from '@services/content/controller';
import authMiddleware from '@/middlewares/auth.middleware';

export function getRouter() {
  const router = Router();

  router.get('/:fileName', authMiddleware as any, contentController.getContent, errorMiddleware);
  router.post('/', authMiddleware as any, contentController.postContent, errorMiddleware);
  router.delete('/:fileName', authMiddleware as any, contentController.deleteContent, errorMiddleware);

  router.post('/private', authMiddleware as any, contentController.postPrivateContent, errorMiddleware);
  router.get('/private/:fileName', authMiddleware as any, contentController.getPrivateContent, errorMiddleware);

  return router;
}
