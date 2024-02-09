import closeOpenConnections from './closeOpenConnections';
import logger from '../logger';

const runStartUpActions = async () => {
  logger.info('Running statup actions');

  logger.info('Running closeOpenConnections startup action');
  await closeOpenConnections();
};

export default runStartUpActions;
