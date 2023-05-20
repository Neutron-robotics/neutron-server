import { Router } from 'express';
import login from './login';
import register from './register';

const useAuthentification = (router: Router) => {
  router.post('/auth/login', login);
  router.post('/auth/register', register);
};

export default useAuthentification;
