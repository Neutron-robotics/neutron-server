import { Router } from 'express';
import create from './create';
import update from './update';
import deleteRobotPart from './deleteRobotPart';

const useRobotPartController = (router: Router) => {
  router.post('/robot/:robotId/part/create', create);
  router.post('/robot/:robotId/part/:partId/update', update);
  router.delete('/robot/:robotId/part/:partId', deleteRobotPart);
};

export default useRobotPartController;
