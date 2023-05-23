import { Router } from 'express';
import login from './login';
import register from './register';
import verify from './verify';
import deleteUser from './delete';

const useAuthentification = (router: Router) => {
  router.post('/auth/login', login);
  router.post('/auth/register', register);
  router.post('/auth/verify', verify);
  router.delete('/auth/delete', deleteUser);
};

export default useAuthentification;
