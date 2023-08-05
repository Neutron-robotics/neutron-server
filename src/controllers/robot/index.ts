import { Router } from 'express';
import activate from './activate';
import create from './create';
import deleteRobot from './deleteRobot';
import getConfiguration from './getConfiguration';
import update from './update';

const useRobotController = (router: Router) => {
  router.post('/robot/create', create);
  router.post('/robot/activate', activate);
  router.post('/robot/update/:robotId', update);
  router.get('/robot/configuration/:secretKey', getConfiguration);
  router.delete('/robot/:robotId', deleteRobot);
};

export default useRobotController;
