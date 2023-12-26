import { Router } from 'express';
import link from './link';
import publishSystemInformation from './publishSystemInformation';

const useAgentController = (router: Router) => {
  router.post('/agent/link', link);
  router.post('/agent/publishSystemInformation', publishSystemInformation);
};

export default useAgentController;
