import { NextFunction, Response } from 'express';
import DropyService from '@/services/dropy.service';
import { MediaType } from '@prisma/client';
import { UploadedFile } from 'express-fileupload';
import { HttpException } from '@/exceptions/HttpException';
import { Controller } from '../Controller';
import { AuthenticatedRequest } from '@/interfaces/auth.interface';

class DropyController extends Controller {
  public dropyService = new DropyService();

  public createDropy = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { latitude, longitude } = req.body;
      this.throwIfNotNumber(latitude, longitude);

      const dropy = await this.dropyService.createDropy(req.user, latitude, longitude);
      res.status(200).json(dropy);
    } catch (error) {
      next(error);
    }
  };

  public createDropyMedia = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dropyId = Number(req.params.id);
      this.throwIfNotNumber(dropyId);

      const requestData = req.files ?? req.body;

      if (this.isNull(requestData)) {
        throw new HttpException(400, 'No form data found');
      }

      const [formField, mediaPayload] = Object.entries(requestData)[0] as [string, UploadedFile | string];

      if (this.isNull(formField, mediaPayload)) {
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

      await this.dropyService.createDropyMedia(req.user, dropyId, mediaPayload, mediaType);

      res.status(200).json(`Media added for dropy with id ${dropyId}`);
    } catch (error) {
      next(error);
    }
  };

  public findAround = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { latitude, longitude } = req.body;
      this.throwIfNotNumber(latitude, longitude);

      const dropiesAround = await this.dropyService.findAround(req.user, latitude, longitude);
      res.status(200).json(dropiesAround);
    } catch (error) {
      next(error);
    }
  };

  public retrieveDropy = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { dropyId } = req.body;
      this.throwIfNotNumber(dropyId);

      await this.dropyService.retrieveDropy(req.user, dropyId);
      res.status(200).json(`Retriever with id ${req.user.id} added for dropy with id ${dropyId}`);
    } catch (error) {
      next(error);
    }
  };

  public getDropyMedia = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dropyId = Number(req.params.id);
      this.throwIfNotNumber(dropyId);

      const dropy = await this.dropyService.getDropyById(dropyId);

      if (req.user.id != dropy.retrieverId) {
        throw new HttpException(403, `User with id ${req.user.id} not allow to retrieve dropy with id ${dropy.id}`);
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

  public getDropy = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dropyId = Number(req.params.id);
      this.throwIfNotNumber(dropyId);

      const dropy = await this.dropyService.getDropy(dropyId);

      if (req.user.id != dropy.retrieverId) {
        throw new HttpException(403, `User with id ${req.user.id} not allow to retrieve dropy with id ${dropy.id}`);
      }

      res.status(200).json(dropy);
    } catch (error) {
      next(error);
    }
  };
}

export default DropyController;
