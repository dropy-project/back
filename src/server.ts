import App from '@/app';
import AuthRoute from '@routes/auth.route';
import UsersRoute from '@routes/users.route';
import validateEnv from '@utils/validateEnv';
import DropyRoute from './routes/dropy.route';

console.log('Entry');

validateEnv();
console.log('Validate');

// const app = new App([new UsersRoute(), new AuthRoute(), new DropyRoute()]);
const app = new App([new AuthRoute()]);

console.log('App created');

app.listen();
console.log('Listen');
