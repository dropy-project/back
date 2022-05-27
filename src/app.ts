import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Routes } from '@interfaces/routes.interface';
import fileUpload from 'express-fileupload';

class App {
  public app: express.Application;
  public env: string;
  public port: string | number;

  constructor(routes: Routes[]) {
    console.log('CONTRUCTOR');
    this.app = express();
    this.port = 3000;

    console.log('SETUP APP');
    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeSwagger();
  }

  public listen() {
    this.app.listen(this.port, () => {
      console.log(`==============================`);
      console.log(`🚀 App listening on the port ${this.port}`);
      console.log(`==============================`);
    });
  }

  public getServer() {
    return this.app;
  }

  private initializeMiddlewares() {
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());

    this.app.use(
      fileUpload({
        createParentPath: true,
      }),
    );
  }

  private initializeRoutes(routes: Routes[]) {
    routes.forEach(route => {
      this.app.use('/', route.router);
    });
  }

  private initializeSwagger() {
    const options = {
      swaggerDefinition: {
        info: {
          title: 'REST API',
          version: '1.0.0',
          description: 'Example docs',
        },
      },
      apis: ['swagger.yaml'],
    };

    const specs = swaggerJSDoc(options);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  }
}

export default App;
