import * as authRoutes from '@routes/auth.route';
import * as usersRoutes from '@routes/users.route';
import * as dropyRoutes from './routes/dropy.route';
import dotenv from 'dotenv';

import fileUpload from 'express-fileupload';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import cors from 'cors';
import * as dropySocket from './sockets/dropy.socket';
import * as chatSocket from './sockets/chat.socket';

import { logStartedService } from './utils/logs.utils';

dotenv.config();

const app: express.Application = express();

const apiPort = Number(process.env.API_PORT) || 3000;

initializeMiddleWares();
initializeRoutes();

dropySocket.startSocket();
chatSocket.startSocket();

app.listen(apiPort, () => {
  logStartedService('API', apiPort);
});

function initializeMiddleWares() {
  app.use(hpp());
  app.use(cors());
  app.use(helmet());
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(':date[web] - :method :url :status :res[content-length] - :response-time ms'));
  app.use(handleTopLevelErrors);
  app.use(
    fileUpload({
      createParentPath: true,
    }),
  );
}

function initializeRoutes() {
  app.use(authRoutes.getRouter());
  app.use(dropyRoutes.getRouter());
  app.use(usersRoutes.getRouter());
}

function handleTopLevelErrors(err, req, res, next) {
  res.status(400).json(err.message ?? 'Bad request');
  next();
}
