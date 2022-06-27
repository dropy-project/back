import { Routes } from '@interfaces/routes.interface';

import fileUpload from 'express-fileupload';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import cors from 'cors';

class App {
  public app: express.Application;
  public env: string;
  public port: string | number;

  constructor(routes: Routes[]) {
    this.app = express();
    this.port = process.env.PORT || 3000;

    this.initializeMiddlewares();
    this.initializeRoutes(routes);
  }

  public listen() {
    this.app.listen(this.port, () => {
      console.log(`==============================`);
      console.log(`🚀 App listening on the port ${this.port}`);
      console.log(`==============================`);
    });
  }

  private initializeMiddlewares() {
    this.app.use(hpp());
    this.app.use(cors());
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
    this.app.use(morgan(':date[web] - :method :url :status :res[content-length] - :response-time ms'));

    this.app.use(
      fileUpload({
        createParentPath: true,
      }),
    );
  }

  private initializeRoutes(routes: Routes[]) {
    this.app.get('/', function (req, res) {
      res.send('Dropy API');
    });

    routes.forEach(route => {
      this.app.use('/', route.router);
    });
  }
}

export default App;
