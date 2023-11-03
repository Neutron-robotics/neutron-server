import { Router } from 'express';
import create from './create';
import join from './join';
import closeConnection from './closeConnection';

const useConnection = (router: Router) => {
  router.post('/connection/create', create);
  router.post('/connection/join/:connectionId', join);
  router.post('/connection/close/:connectionId', closeConnection);
};

export default useConnection;
