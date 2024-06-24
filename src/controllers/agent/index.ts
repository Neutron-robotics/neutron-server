import { Router } from 'express';
import link from './link';
import publishSystemInformation from './publishSystemInformation';
import getPort from './getPort';

const useAgentController = (router: Router) => {
  router.post('/agent/port', getPort);
  router.post('/agent/link', link);
  router.post('/agent/publishSystemInformation', publishSystemInformation);
};

export default useAgentController;
