import { NextFunction, Request, Response } from 'express';
import { User } from '@prisma/client';
import * as authService from '@services/api/services/auth.service';
import * as utils from '@utils/controller.utils';
import versionsJSON from '../../../../versions.json';
import { HttpException } from '@/exceptions/HttpException';

export async function versionCheck(req: Request, res: Response, next: NextFunction) {
  try {
    const frontServerVersion = req.params.serverVersion;
    utils.throwIfNotString(frontServerVersion);

    const minimumVersion = versionsJSON.minimumCompatibleVersion;

    if (frontServerVersion >= minimumVersion) {
      res.status(200).json('Correct current version');
    } else {
      throw new HttpException(418, `Current version outdated`);
    }
  } catch (error) {
    next(error);
  }
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, displayName, password } = req.body;
    utils.throwIfNotString(email, displayName, password);

    const createUserData: User = await authService.register(displayName, email, password);

    res.status(201).json(createUserData);
  } catch (error) {
    next(error);
  }
}

export async function logIn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    utils.throwIfNotString(email, password);

    const authData = await authService.login(email, password);
    res.status(200).json(authData);
  } catch (error) {
    next(error);
  }
}

export async function refreshAuthToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body;
    utils.throwIfNotString(refreshToken);

    const tokens = await authService.refreshAuthToken(refreshToken);
    res.status(200).json(tokens);
  } catch (error) {
    next(error);
  }
}
