import { Router } from 'express';
import create from './create';
import deleteOrganization from './delete';
import me from './me';
import promote from './promote';
import demote from './demote';
import update from './update';

const useOrganization = (router: Router) => {
  router.post('/organization/create', create);
  router.get('/organization/me', me);

  router.post('/organization/:organization/update', update);
  router.post('/organization/:organization/promote', promote);
  router.post('/organization/:organization/demote', demote);
  router.delete('/organization/:organization/delete', deleteOrganization);
};

export default useOrganization;
