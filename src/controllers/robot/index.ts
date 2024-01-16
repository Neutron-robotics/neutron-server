import { Router } from 'express';
import activate from './activate';
import create from './create';
import deleteRobot from './deleteRobot';
import getConfiguration from './getConfiguration';
import update from './update';
import getStatus from './getStatus';
import getById from './getById';
import start from './start';
import stopRobot from './stopRobot';

const useRobotController = (router: Router) => {
  router.post('/robot/create', create);
  router.post('/robot/activate', activate);
  router.post('/robot/update/:robotId', update);
  router.post('/robot/start/:robotId', start);
  router.post('/robot/stop/:robotId', stopRobot);
  router.get('/robot/status/:robotId', getStatus);
  router.get('/robot/:robotId', getById);
  router.get('/robot/configuration/:secretKey', getConfiguration);
  router.delete('/robot/:robotId', deleteRobot);
};

export default useRobotController;
