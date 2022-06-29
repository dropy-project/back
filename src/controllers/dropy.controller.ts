import { NextFunction, Request, Response } from 'express';
import DropyService from '@/services/dropy.service';
import { MediaType } from '@prisma/client';
import { UploadedFile } from 'express-fileupload';
import { getUserIdFromToken } from '@/utils/auth.utils';
import { HttpException } from '@/exceptions/HttpException';
import { Controller } from '../Controller';

class DropyController extends Controller {
  public dropyService = new DropyService();

  public createDropy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { emitterId, latitude, longitude } = req.body;
      if (emitterId == null || latitude == null || longitude == null) {
        throw HttpException.MISSING_PARAMETER;
      }

      const dropy = await this.dropyService.createDropy(emitterId, latitude, longitude);
      res.status(200).json(dropy);
    } catch (error) {
      next(error);
    }
  };

  public createDropyMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dropyId = Number(req.params.id);

      const requestData = req.files ?? req.body;

      if (requestData == null) {
        throw new HttpException(400, 'No form data found');
      }

      const [formField, mediaPayload] = Object.entries(requestData)[0] as [string, UploadedFile | string];

      if (mediaPayload == null) {
        throw new HttpException(400, 'No payload were uploaded.');
      }

      const mediaType = MediaType[formField.toUpperCase()];
      if (mediaType == null) {
        throw new HttpException(400, `Unsuported dropy media type : ${formField}`);
      }

      const isFile = (mediaPayload as UploadedFile).mimetype != null;
      if (isFile && (mediaPayload as UploadedFile).data == null) {
        throw new HttpException(400, 'File data corrupted or more than one file sent at once');
      }

      await this.dropyService.createDropyMedia(dropyId, mediaPayload, mediaType);

      res.status(200).json(`Media added for dropy with id ${dropyId}`);
    } catch (error) {
      next(error);
    }
  };

  public findAround = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, latitude, longitude } = req.body;

      if (userId == undefined || latitude == undefined || longitude == undefined) {
        throw HttpException.MISSING_PARAMETER;
      }

      const dropiesAround = await this.dropyService.findAround(userId, latitude, longitude);
      res.status(200).json(dropiesAround);
    } catch (error) {
      next(error);
    }
  };

  public retrieveDropy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { retrieverId, dropyId } = req.body;

      if (retrieverId == undefined || dropyId == undefined) {
        throw HttpException.MISSING_PARAMETER;
      }

      await this.dropyService.retrieveDropy(retrieverId, dropyId);
      res.status(200).json(`Retriever with id ${retrieverId} added for dropy with id ${dropyId}`);
    } catch (error) {
      next(error);
    }
  };

  public getDropyMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dropyId = Number(req.params.id);

      if (dropyId == undefined || dropyId == NaN) {
        throw HttpException.MISSING_PARAMETER;
      }

      const dropy = await this.dropyService.getDropyById(dropyId);

      const currentUserId = await getUserIdFromToken(req);

      if (currentUserId != dropy.retrieverId) {
        throw new HttpException(403, `User with id ${currentUserId} not allow to retrieve dropy with id ${dropy.id}`);
      }

      const mediaType = dropy.mediaType;

      if (mediaType == MediaType.PICTURE || mediaType == MediaType.VIDEO) {
        if (dropy.filePath == undefined) {
          throw new HttpException(404, `Media filePath from dropy with id ${dropyId} not found`);
        }

        res.status(200).sendFile(dropy.filePath);
      } else {
        if (dropy.mediaData == undefined) {
          throw new HttpException(404, `Media data from dropy with id ${dropyId} not found`);
        }

        res.status(200).json(dropy.mediaData);
      }
    } catch (error) {
      next(error);
    }
  };

  public getDropy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dropyId = Number(req.params.id);

      if (dropyId == undefined || dropyId == NaN) {
        throw HttpException.MISSING_PARAMETER;
      }

      const dropy = await this.dropyService.getDropy(dropyId);

      const currentUserId = await getUserIdFromToken(req);

      if (currentUserId != dropy.retrieverId) {
        throw new HttpException(403, `User with id ${currentUserId} not allow to retrieve dropy with id ${dropy.id}`);
      }

      res.status(200).json(dropy);
    } catch (error) {
      this.handleError(error, res, next);
    }
  };
}

export default DropyController;
