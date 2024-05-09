import logger from '../../logger';
import elasticServer from './elastic';
import { IElasticUserCreate } from './types';

const createElasticUser = async (user: IElasticUserCreate) => {
  try {
    const response = await elasticServer.put(
      `/_security/user/${user.username}`,
      { ...user }
    );
    logger.info('Elasticsearch user created successfully:', response.data);
  } catch (error: any) {
    logger.error('Error creating user:', error.response.data);
  }
};

export default createElasticUser;
