import { NextFunction, Response } from 'express';
import { MediaType } from '@prisma/client';
import { HttpException } from '@/exceptions/HttpException';
import { AuthenticatedRequest } from '@interfaces/auth.interface';
import * as dropyService from '@services/api/services/dropy.service';
import * as utils from '@utils/controller.utils';

export async function getDropyMedia(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const dropyId = Number(req.params.id);
    utils.throwIfNotNumber(dropyId);

    const dropy = await dropyService.getDropyById(dropyId);

    const isAllowed = req.user.id === dropy.emitterId || req.user.id === dropy.retrieverId;
    if (!isAllowed) {
      throw new HttpException(403, `User with id ${req.user.id} not allow to retrieve dropy with id ${dropy.id}`);
    }

    const mediaType = dropy.mediaType;

    if (mediaType == MediaType.PICTURE || mediaType == MediaType.VIDEO) {
      throw new HttpException(404, `The media on this dropy can be found on ${dropy.mediaUrl?.split('?')[0]}`);
    } else {
      if (dropy.mediaData == undefined) {
        throw new HttpException(404, `Media data from dropy with id ${dropyId} not found`);
      }

      res.status(200).json(dropy.mediaData);
    }
  } catch (error) {
    next(error);
  }
}

export async function getDropy(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const dropyId = Number(req.params.id);
    utils.throwIfNotNumber(dropyId);

    const dropy = await dropyService.getDropy(dropyId);

    if (req.user.id != dropy.retrieverId) {
      throw new HttpException(403, `User with id ${req.user.id} not allow to retrieve dropy with id ${dropy.id}`);
    }

    res.status(200).json(dropy);
  } catch (error) {
    next(error);
  }
}

export async function userEmittedDropies(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const drops = await dropyService.userEmittedDropies(req.user);
    res.status(200).json(drops);
  } catch (error) {
    next(error);
  }
}

export async function deleteDropy(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const dropyId = Number(req.params.id);
    utils.throwIfNotNumber(dropyId);

    await dropyService.deleteDropy(dropyId, req.user, req.header('Authorization'));

    res.status(200).json(`Dropy with id ${dropyId} deleted`);
  } catch (error) {
    next(error);
  }
}
