import { Router } from 'express';
import create from './create';
import deleteOrganization from './delete';
import me from './me';
import promote from './promote';
import demote from './demote';
import update from './update';
import getMember from './getMember';

const useOrganization = (router: Router) => {
  router.post('/organization/create', create);
  router.get('/organization/me', me);
  router.get('/organization/:organization/getMember', getMember);

  router.post('/organization/:organization/update', update);
  router.post('/organization/:organization/promote', promote);
  router.post('/organization/:organization/demote', demote);
  router.delete('/organization/:organization/delete', deleteOrganization);
};

export default useOrganization;
