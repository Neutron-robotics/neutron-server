import { Router } from 'express';
import users from './users';
import deleteUsers from './delete';
import update from './update';
import inviteUser from './inviteUser';

const useAdminController = (router: Router) => {
  router.get('/admin/users', users);
  router.post('/admin/user/:userId/update', update);
  router.post('/admin/inviteUser', inviteUser);
  router.delete('/admin/user', deleteUsers);
};

export default useAdminController;
