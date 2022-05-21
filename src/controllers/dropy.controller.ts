import { NextFunction, Request, Response } from 'express';
import DropyService from '@/services/dropy.service';

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
      const dropy = await this.dropyService.createDropyMedia(dropyId, req.body);
      res.status(200).json(dropy);
    } catch (error) {
      next(error);
    }
  };
}

export default DropyController;
