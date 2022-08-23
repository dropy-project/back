import { Router } from 'express';
import * as usersController from '@controllers/users.controller';
import errorMiddleware from '@/middlewares/error.middleware';
import authMiddleware from '@/middlewares/auth.middleware';

const path = '/user';

export function getRouter() {
  const router = Router();

  router.post(`${path}/updateDeviceToken`, authMiddleware as any, usersController.updateDeviceToken, errorMiddleware);
  router.post(`${path}/backgroundGeolocationPing`, authMiddleware as any, usersController.backgroundGeolocationPing, errorMiddleware);

  router.get(`${path}/profile/:userId`, authMiddleware as any, usersController.getProfile, errorMiddleware);
  router.get(`${path}/profile/:userId/picture`, authMiddleware as any, usersController.getProfilePicture, errorMiddleware);

  router.post(`${path}/profile`, authMiddleware as any, usersController.updateUserProfile, errorMiddleware);
  router.post(`${path}/profile/picture`, authMiddleware as any, usersController.updateProfilePicture, errorMiddleware);
  router.delete(`${path}/profile/picture`, authMiddleware as any, usersController.deleteProfilePicture, errorMiddleware);

  router.post(`${path}/report/:userId`, authMiddleware as any, usersController.reportUser, errorMiddleware);
  router.post(`${path}/block/:userId`, authMiddleware as any, usersController.blockUser, errorMiddleware);

  return router;
}
