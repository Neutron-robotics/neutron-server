import { Router } from 'express';
import createAction from './createAction';
import createTopic from './createTopic';
import createPublisher from './createPublisher';
import createSubscriber from './createSubscriber';
import createService from './createService';
import deleteTopic from './deleteTopic';
import deletePublisher from './deletePublisher';
import deleteSubscriber from './deleteSubscriber';
import deleteAction from './deleteAction';
import deleteService from './deleteService';

const useRobotPartController = (router: Router) => {
  router.post('/ros2/:robotId/:partId/createTopic', createTopic);
  router.post('/ros2/:robotId/:partId/createPublisher', createPublisher);
  router.post('/ros2/:robotId/partId/createSubscriber', createSubscriber);
  router.post('/ros2/:robotId/:partId/createAction', createAction);
  router.post('/ros2/:robotId/:partId/createService', createService);

  router.delete('/ros2/:robotId/:partId/deleteTopic/:topicId', deleteTopic);
  router.delete('/ros2/:robotId/:partId/deletePublisher/:publisherId', deletePublisher);
  router.delete('/ros2/:robotId/:partId/deleteSubscriber/:subscriberId', deleteSubscriber);
  router.delete('/ros2/:robotId/:partId/deleteAction/:actionId', deleteAction);
  router.delete('/ros2/:robotId/:partId/deleteService/:serviceId', deleteService);
};

export default useRobotPartController;
