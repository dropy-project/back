import { NextFunction, Request, Response } from 'express';
import DropyService from '@/services/dropy.service';
import { MediaType } from '@prisma/client';
import { UploadedFile } from 'express-fileupload';
import { verify } from 'jsonwebtoken';
import { DataStoredInToken } from '@/interfaces/auth.interface';

class DropyController {
  public dropyService = new DropyService();

  public createDropy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dropy = await this.dropyService.createDropy(req.body);
      res.status(200).json(dropy);
    } catch (error) {
      next(error);
    }
  };

  public getDropies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dropies = await this.dropyService.getDropies();
      res.status(200).json(dropies);
    } catch (error) {
      next(error);
    }
  };

  public createDropyMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dropyId = Number(req.params.id);

      const requestData = req.files ?? req.body;

      if (requestData == undefined) {
        res.status(400).send('No form data');
        return;
      }

      const [formField, mediaPayload] = Object.entries(requestData)[0] as [string, UploadedFile | string];

      if (mediaPayload == undefined) {
        res.status(400).send('No payload were uploaded.');
        return;
      }

      const mediaType = MediaType[formField.toUpperCase()];
      if (mediaType == undefined) {
        res.status(400).send(`Unsuported dropy media type : ${formField}`);
        return;
      }

      const isFile = (mediaPayload as UploadedFile).mimetype != undefined;
      if (isFile && (mediaPayload as UploadedFile).data == undefined) {
        res.status(400).send('File data corrupted or more than one file sent at once');
        return;
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
        res.status(400).send('Missing parameters');
        return;
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
        res.status(400).send('Missing parameters');
        return;
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
        res.status(400).send('Missing parameters');
      }

      const dropy = await this.dropyService.getDropyMedia(dropyId);

      const currentUserId = await this.getUserIdFromToken(req);

      if (currentUserId != dropy.retrieverId) {
        res.status(403).send(`User with id ${currentUserId} not allow to retrieve dropy with id ${dropy.id}`);
      }

      const mediaType = dropy.mediaType;

      if (mediaType == MediaType.PICTURE || mediaType == MediaType.VIDEO) {
        if (dropy.filePath == undefined) {
          res.status(404).send(`Media filePath from dropy with id ${dropyId} not found`);
        }

        res.status(200).sendFile(dropy.filePath);
      } else {
        if (dropy.mediaData == undefined) {
          res.status(404).send(`Media data from dropy with id ${dropyId} not found`);
        }

        res.status(200).json(dropy.mediaData);

        // A continuer pour la musique
      }
    } catch (error) {
      next(error);
    }
  };

  public getUserIdFromToken = async (req: Request): Promise<number> => {
    const Authorization = req.cookies['Authorization'] || (req.header('Authorization') ? req.header('Authorization').split('Bearer ')[1] : null);

    if (Authorization == null) {
      return null;
    }

    const secretKey = process.env.SECRET_KEY;
    const verificationResponse = (await verify(Authorization, secretKey)) as DataStoredInToken;

    return verificationResponse.userId;
  };
}

export default DropyController;
