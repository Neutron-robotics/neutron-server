import { Router } from 'express';
import users from './users';
import deleteUsers from './delete';

const useAdminController = (router: Router) => {
  router.get('/admin/users', users);
  router.delete('/admin/user', deleteUsers);
};

export default useAdminController;
