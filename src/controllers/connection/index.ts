import { Router } from 'express';
import create from './create';
import join from './join';
import closeConnection from './closeConnection';
import getConnectionById from './getConnectionById';
import me from './me';

const useConnection = (router: Router) => {
  router.get('/connection', me);
  router.get('/connection/:connectionId', getConnectionById);
  router.post('/connection/create', create);
  router.post('/connection/join/:connectionId', join);
  router.post('/connection/close/:connectionId', closeConnection);
};

export default useConnection;
