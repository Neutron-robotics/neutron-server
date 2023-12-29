import { Router } from 'express';
import getById from './getById';
import me from '../robot/me';

const useUserController = (router: Router) => {
  router.get('/user/:userId', getById);
  router.get('/user/me/robots', me);
};

export default useUserController;
