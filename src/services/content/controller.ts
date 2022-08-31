import { HttpException } from '@/exceptions/HttpException';
import { AuthenticatedRequest } from '@/interfaces/auth.interface';
import { NextFunction, Response } from 'express';
import fs from 'fs';
import { UploadedFile } from 'express-fileupload';
import { throwIfNotString } from '@/utils/controller.utils';
import crypto from 'crypto-js';

const PUBLIC_PATH_PREFIX = process.cwd() + '/.content/public/';
const PRIVATE_PATH_PREFIX = process.cwd() + '/.content/private/';
const URL_PREFIX = process.env.CONTENT_URL_PREFIX ?? 'http://localhost:6000';

export async function getContent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { fileName } = req.params;
    throwIfNotString(fileName);

    const filePath = PUBLIC_PATH_PREFIX + fileName;

    if (!fs.existsSync(filePath)) {
      throw new HttpException(404, 'File not found');
    }

    res.status(200).sendFile(filePath);
  } catch (error) {
    next(error);
  }
}

export async function postContent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const file = req.files['image'] as UploadedFile;
    const extensionFile = file.mimetype.split('/').pop();

    const now = new Date().getTime();
    const fileName = now.toString() + '_' + req.user.id + '.' + extensionFile;

    const filePath = PUBLIC_PATH_PREFIX + fileName;

    file.mv(filePath);

    res.status(200).send({
      fileUrl: `${URL_PREFIX}/${fileName}`,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteContent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { fileName } = req.params;
    throwIfNotString(fileName);

    const filePath = PUBLIC_PATH_PREFIX + fileName;

    if (!fs.existsSync(filePath)) {
      throw new HttpException(404, 'File not found');
    }

    const fileOwnerId = parseInt(fileName.split('_')[1].split('.')[0]);

    if (fileOwnerId !== req.user.id) {
      throw new HttpException(403, 'You are not the owner of this file');
    }

    fs.unlinkSync(filePath);

    res.status(200).send('File deleted');
  } catch (error) {
    next(error);
  }
}

export async function getPrivateContent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { fileName } = req.params;
    const { accessToken } = req.query;
    console.log(fileName, accessToken);
    throwIfNotString(fileName, accessToken as any);

    const filePath = PRIVATE_PATH_PREFIX + fileName;

    if (!fs.existsSync(filePath)) {
      throw new HttpException(404, 'File not found');
    }

    const fileId = fileName.split('_')[0];
    const expectedToken = crypto.HmacSHA1(fileId, process.env.ACCESS_SECRET_KEY).toString();

    if (accessToken !== expectedToken) {
      throw new HttpException(403, 'You are not allowed to get this file');
    }

    res.status(200).sendFile(filePath);
  } catch (error) {
    next(error);
  }
}

export async function postPrivateContent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const file = req.files['image'] as UploadedFile;
    const extensionFile = file.mimetype.split('/').pop();

    const now = new Date().getTime();
    const fileId = now + Math.round(Math.random() * 100);
    const accessToken = crypto.HmacSHA1(fileId.toString(), process.env.ACCESS_SECRET_KEY).toString();

    const fileName = fileId + '_' + req.user.id + '.' + extensionFile;

    const filePath = PRIVATE_PATH_PREFIX + fileName;

    file.mv(filePath);

    res.status(200).send({
      fileUrl: `${URL_PREFIX}/private/${fileName}`,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
}