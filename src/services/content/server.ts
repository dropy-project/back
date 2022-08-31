import { logStartedService } from '@/utils/logs.utils';

import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import * as routes from './routes';

const app: express.Application = express();
const contentPort = 6000;

app.listen(contentPort, () => {
  logStartedService('Dropy content', contentPort);
});

initializeMiddleWares();
initializeRoutes();

logStartedService('Dropy content management', contentPort);

function initializeMiddleWares() {
  app.use(hpp());
  app.use(cors());
  app.use(helmet());
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan('[Content] :date[web] - :method :url :status :res[content-length] - :response-time ms'));
  app.use(handleTopLevelErrors);
  app.use(
    fileUpload({
      createParentPath: true,
    }),
  );
}

function initializeRoutes() {
  app.use(routes.getRouter());
}

function handleTopLevelErrors(err, req, res, next) {
  res.status(400).json(err.message ?? 'Bad request');
  next();
}
