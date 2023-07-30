import { Router } from 'express';

const useRobotController = (router: Router) => {
  router.post('/robot/create');
  router.post('/robot/activate/:id');
  router.post('/robot/update/:id');
  router.delete('/robot/:id');
};

export default useRobotController;
