import { NextFunction, Response } from 'express';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import admZip from 'adm-zip';
import { AuthenticatedRequest } from '@interfaces/auth.interface';
import * as userService from '@services/api/services/users.service';
import * as utils from '@utils/controller.utils';
import { User } from '@prisma/client';
import { UploadedFile } from 'express-fileupload';
import { HttpException } from '@/exceptions/HttpException';

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

    const { coords } = location;
    const { latitude, longitude } = coords;

    utils.throwIfNotNumber(latitude, longitude);

    await userService.backgroundGeolocationPing(req.user, latitude, longitude);
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

export async function getUserProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await userService.getUserProfile(req.user.id);
    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
}

export async function updateProfilePicture(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    utils.throwIfNull(req.files);

    const file = req.files['profile'] as UploadedFile;
    utils.throwIfNull(file);
    const newAvatarUrl = await userService.updateProfilePicture(req.user, file, req.header('Authorization'));
    res.status(200).json(newAvatarUrl);
  } catch (error) {
    next(error);
  }
}

export async function deleteProfilePicture(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await userService.deleteProfilePicture(req.user, req.header('Authorization'));
    res.status(200).json('Profile picture has been deleted');
  } catch (error) {
    next(error);
  }
}

export async function getProfilePicture(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params;
    utils.throwIfNotNumber(userId);

    const filePath = await userService.getProfilePicture(parseInt(userId));
    utils.throwIfNotString(filePath);

    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
}

export async function reportUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params;
    utils.throwIfNotNumber(userId);

    const { dropyId } = req.body;

    if (dropyId != null) {
      utils.throwIfNotNumber(dropyId);
    }

    if (parseInt(userId) === req.user.id) {
      throw new HttpException(301, 'You cannot report yourself');
    }

    await userService.reportUser(parseInt(userId), req.user, dropyId);
    res.status(200).json('User reported');
  } catch (error) {
    next(error);
  }
}

export async function blockUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params;
    utils.throwIfNotNumber(userId);

    if (parseInt(userId) === req.user.id) {
      throw new HttpException(301, 'You cannot block yourself');
    }

    await userService.blockUser(parseInt(userId), req.user);
    res.status(200).json('User blocked');
  } catch (error) {
    next(error);
  }
}

export async function getBlockedUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const blockedUsers = await userService.getBlockedUsers(req.user);
    res.status(200).json(blockedUsers);
  } catch (error) {
    next(error);
  }
}

export async function unblockUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params;
    utils.throwIfNotNumber(userId);

    await userService.unblockUser(parseInt(userId), req.user);
    res.status(200).json('User unblocked');
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await userService.deleteUser(req.user);
    res.status(200).json('User has been deleted');
  } catch (error) {
    next(error);
  }
}

export async function getNotificationsSettings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await userService.getNotificationsSettings(req.user);
    res.status(200).json(settings);
  } catch (error) {
    next(error);
  }
}

export async function updateNotificationsSettings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { dailyDropyReminder, dropyCollected, newFeature } = req.body;
    utils.throwIfNotBoolean(dailyDropyReminder, dropyCollected, newFeature);

    await userService.updateNotificationsSettings(req.user, req.body);
    res.status(200).json('Notifications settings updated');
  } catch (error) {
    next(error);
  }
}

export async function requestUserPersonalData(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!process.env.MAIL_ADDRESS || !process.env.MAIL_PASSWORD) {
      res.status(500).json('Server does not support user personal data request');
      next();
      return;
    }

    const userPersonalData = await userService.requestUserPersonalData(req.user);
    const userPersonalDataFileName = 'userPersonalData.json';

    fs.writeFileSync(userPersonalDataFileName, JSON.stringify(userPersonalData));

    const userPersonalDataZipFileName = 'userPersonalData.zip';
    const zip = new admZip();
    zip.addLocalFile(userPersonalDataFileName);
    zip.writeZip(userPersonalDataZipFileName);

    const userEmail = req.user.email;

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

    const filePath = path.join(__dirname, '../../../resources/templates/requestUserPersonalData.html');
    const source = fs.readFileSync(filePath, 'utf8').toString();

    const mailOptions = {
      from: mailAddress,
      to: userEmail,
      subject: 'DROPY-APP - Vos données personnelles',
      html: source,
      attachments: [
        {
          filename: userPersonalDataZipFileName,
          path: path.join(__dirname, '../../../../userPersonalData.zip'),
        },
      ],
    };

    transporter.sendMail(mailOptions, error => {
      if (error) {
        res.status(500).json('User personal data Mail - ' + error.message);
      } else {
        res.status(200).json('Personal data send to user email');
      }

      fs.rm(path.join(__dirname, '../../../../userPersonalData.zip'), error => {
        if (error) {
          console.error('REQUEST USER PERSONAL DATA ZIP - ' + error);
        }
      });

      fs.rm(path.join(__dirname, '../../../../userPersonalData.json'), error => {
        if (error) {
          console.error('REQUEST USER PERSONAL DATA JSON - ' + error);
        }
      });
    });
  } catch (error) {
    next(error);
  }
}

export async function logOut(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await userService.logOut(req.user);
    res.status(200).json('User logged out');
  } catch (error) {
    next(error);
  }
}
