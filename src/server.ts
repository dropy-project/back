import App from '@/app';
import AuthRoute from '@routes/auth.route';
import UsersRoute from '@routes/users.route';
import validateEnv from '@utils/validateEnv';
import DropyRoute from './routes/dropy.route';

validateEnv();

const app = new App([new UsersRoute(), new AuthRoute(), new DropyRoute()]);

app.listen();
