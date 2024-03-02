import closeOpenConnections from './closeOpenConnections';
import logger from '../logger';
import ros2StandardTypes from './ros2StandardTypes';

const runStartUpActions = async () => {
  logger.info('Running statup actions');

  logger.info('Running closeOpenConnections startup action');
  await closeOpenConnections();

  logger.info('Running ros2StandardType startup action');
  await ros2StandardTypes();
};

export default runStartUpActions;
