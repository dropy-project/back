import { NextFunction, Request, Response } from 'express';
import nodemailer from 'nodemailer';
import * as authService from '@services/api/services/auth.service';
import * as utils from '@utils/controller.utils';
import versionsJSON from '../../../../versions.json';
import { HttpException } from '@/exceptions/HttpException';
import { isVersionSuperiorOrEqual } from '@/utils/auth.utils';

export async function versionCheck(req: Request, res: Response, next: NextFunction) {
  try {
    const { serverVersion: frontServerVersion } = req.params;
    utils.throwIfNotString(frontServerVersion);

    const minimumVersion = versionsJSON.minimumCompatibleVersion;

    if (isVersionSuperiorOrEqual(frontServerVersion, minimumVersion)) {
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
    utils.throwIfNotEmail(email);
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
    utils.throwIfNotEmail(email);
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

export async function emailAvailable(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.params;
    utils.throwIfNotString(email);
    utils.throwIfNotEmail(email);

    const isEmailAvailable = await authService.emailAvailable(email);
    res.status(200).json(isEmailAvailable);
  } catch (error) {
    next(error);
  }
}

export async function requestResetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;
    utils.throwIfNotString(email);
    utils.throwIfNotEmail(email);

    const resetPasswordToken = await authService.requestResetPassword(email);

    console.log(resetPasswordToken);

    const mailAddress = process.env.MAIL_ADDRESS;
    const mailPassword = process.env.MAIL_PASSWORD;

    const transporter = nodemailer.createTransport({
      host: 'smtp.ionos.fr',
      port: 465,
      secure: true,
      auth: {
        user: mailAddress,
        pass: mailPassword,
      },
    });

    const mailOptions = {
      from: mailAddress,
      to: email,
      subject: 'DROPY-APP - Reset password',
      html: `<p>Click <a href="https://dropy-app.com/reset-password?token=${resetPasswordToken.resetPasswordToken}">here</a> to reset your password</p>`,
    };

    transporter.sendMail(mailOptions, error => {
      if (error) {
        console.log(error);
        res.status(500).json('MAIL - ' + error.message);
      } else {
        res.status(200).json('Reset password request sent');
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { resetPasswordToken, password } = req.body;
    utils.throwIfNotString(resetPasswordToken);
    utils.throwIfNotString(password);

    await authService.resetPassword(resetPasswordToken, password);

    res.status(200).json('Password reset');
  } catch (error) {
    next(error);
  }
}
