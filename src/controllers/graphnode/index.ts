import { Router } from 'express';
import create from './create';
import deleteGraph from './deleteGraph';
import getByOrganization from './getByOrganization';
import me from './me';
import update from './update';

const useNeutronGraph = (router: Router) => {
  router.post('/graph/create', create);
  router.get('/graph/me', me);
  router.get('/graph/organization/:organizationId', getByOrganization);
  router.post('/graph/update/:graphId', update);
  router.delete('/graph/:graphId', deleteGraph);
};

export default useNeutronGraph;
