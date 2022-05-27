import App from '@/app';
import AuthRoute from '@routes/auth.route';
import UsersRoute from '@routes/users.route';
import DropyRoute from './routes/dropy.route';

require('dotenv').config();

const app = new App([new UsersRoute(), new AuthRoute(), new DropyRoute()]);

app.listen();
