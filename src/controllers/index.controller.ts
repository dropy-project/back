import { NextFunction, Request, Response } from 'express';

class IndexController {
  public index = (req: Request, res: Response, next: NextFunction): void => {
    try {
      //add some json to the response
      res.json({
        message: 'Hello World',
      });

      res.sendStatus(200);

    } catch (error) {
      next(error);
    }
  };
}

export default IndexController;
