import { Router } from 'express';
import login from './login';
import register from './register';
import verify from './verify';
import deleteUser from './delete';
import me from './me';
import reset from './reset';
import update from './update';
import refresh from './refresh';

const useAuthentification = (router: Router) => {
  router.post('/auth/login', login);
  router.post('/auth/register', register);
  router.post('/auth/refresh-token', refresh);
  router.post('/auth/verify', verify);
  router.get('/auth/me', me);
  router.post('/auth/reset', reset);
  router.post('/auth/update', update);
  router.delete('/auth/delete', deleteUser);
};

export default useAuthentification;
