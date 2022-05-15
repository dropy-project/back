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
}

export default DropyController;