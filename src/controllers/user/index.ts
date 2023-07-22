import { Router } from 'express';
import getById from './getById';

const useUserController = (router: Router) => {
  router.get('/user/:userId', getById);
};

export default useUserController;
