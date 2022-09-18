import { NextFunction, Request, Response } from 'express';
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
    const { email, displayName, password, newsLetter } = req.body;
    utils.throwIfNotString(email, displayName, password);
    utils.throwIfNotBoolean(newsLetter);
    if (utils.isNotAnEmail(email)) {
      throw new HttpException(400, 'Invalid email');
    }
    const createUserData = await authService.register(displayName, email, password, newsLetter);

    res.status(201).json(createUserData);
  } catch (error) {
    next(error);
  }
}

export async function logIn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    utils.throwIfNotString(email, password);
    if (utils.isNotAnEmail(email)) {
      throw new HttpException(400, 'Invalid email');
    }
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
