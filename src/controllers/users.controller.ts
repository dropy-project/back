import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '@/interfaces/auth.interface';
import * as userService from '@services/users.service';
import * as utils from '@/utils/controller.utils';
import { User } from '@prisma/client';

export async function updateDeviceToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { deviceToken } = req.body;
    utils.throwIfNotString(deviceToken);

    await userService.updateDeviceToken(req.user, deviceToken);

    res.status(200).json('Device token changed');
  } catch (error) {
    next(error);
  }
}

export async function backgroundGeolocationPing(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { location } = req.body;

    utils.throwIfNull(location?.coords, req.user);

    const { timestamp, coords } = location;
    const { latitude, longitude } = coords;

    utils.throwIfNotString(timestamp);
    utils.throwIfNotNumber(latitude, longitude);

    await userService.backgroundGeolocationPing(req.user, latitude, longitude, new Date(timestamp));
    res.status(200).json('Success');
  } catch (error) {
    next(error);
  }
}

export async function changeOnlineStatus(user: User, status: boolean): Promise<void> {
  await userService.changeOnlineStatus(user, status);
}

export async function getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params;
    utils.throwIfNotNumber(userId);

    const profile = await userService.getUserProfile(parseInt(userId));
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
}

export async function updateUserProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { about, pronouns, displayName } = req.body;
    utils.throwIfNotString(about, pronouns, displayName);

    const profile = await userService.updateUserProfile(req.user, req.body);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
}
