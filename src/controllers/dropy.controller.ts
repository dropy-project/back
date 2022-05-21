import { NextFunction, Request, Response } from 'express';
import DropyService from '@/services/dropy.service';
import { MediaType } from '@prisma/client';
import { UploadedFile } from 'express-fileupload';

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

      const [formField, file] = Object.entries(req.files)[0] as [string, UploadedFile];

      if (!file == undefined) {
        res.status(400).send('No files were uploaded.');
        return;
      }

      if (file.data == undefined) {
        res.status(400).send('File data corrupted or more than one file sent at once');
        return;
      }

      const mediaType = MediaType[formField.toUpperCase()];
      if (mediaType == undefined) {
        res.status(400).send(`Unsuported dropy media type : ${formField}`);
        return;
      }

      this.dropyService.createDropyMedia(dropyId, file, mediaType);

      res.status(200).json(`Media added for dropy with id ${dropyId}`);
    } catch (error) {
      next(error);
    }
  };
}

export default DropyController;
