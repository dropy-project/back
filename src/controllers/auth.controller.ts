import { NextFunction, Request, Response } from 'express';
import { User } from '@prisma/client';
import * as authService from '@services/auth.service';
import * as utils from '@/utils/controller.utils';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { uid, displayName } = req.body;
    utils.throwIfNotString(uid, displayName);

    const createUserData: User = await authService.register(uid, displayName);

    res.status(201).json(createUserData);
  } catch (error) {
    next(error);
  }
}

export async function logIn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { uid } = req.body;
    utils.throwIfNotString(uid);

    const authData = await authService.login(uid);

    res.status(200).json(authData);
  } catch (error) {
    next(error);
  }
}

export async function refreshAuthToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body;
    utils.throwIfNotString(refreshToken);

    const { token } = await authService.refreshAuthToken(refreshToken);
    res.status(200).json(token);
  } catch (error) {
    next(error);
  }
}
