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
import createMessageType from './createMessageType';
import getRos2System from './getRos2System';
import updateSchema from './updateSchema';
import getPrimitiveTypes from './getPrimitiveTypes';

const useRos2Controller = (router: Router) => {
  router.post('/ros2/:robotId/:partId/createTopic', createTopic);
  router.post('/ros2/:robotId/:partId/createPublisher', createPublisher);
  router.post('/ros2/:robotId/:partId/createSubscriber', createSubscriber);
  router.post('/ros2/:robotId/:partId/createAction', createAction);
  router.post('/ros2/:robotId/:partId/createService', createService);
  router.post('/ros2/:robotId/:partId/createMessageType', createMessageType);
  router.get('/ros2/:robotId', getRos2System);
  router.get('/ros2/primitiveTypes/all', getPrimitiveTypes);
  router.post('/ros2/:robotId/:schema/update', updateSchema);

  router.delete('/ros2/:robotId/:partId/deleteTopic/:topicId', deleteTopic);
  router.delete('/ros2/:robotId/:partId/deletePublisher/:publisherId', deletePublisher);
  router.delete('/ros2/:robotId/:partId/deleteSubscriber/:subscriberId', deleteSubscriber);
  router.delete('/ros2/:robotId/:partId/deleteAction/:actionId', deleteAction);
  router.delete('/ros2/:robotId/:partId/deleteService/:serviceId', deleteService);
};

export default useRos2Controller;
