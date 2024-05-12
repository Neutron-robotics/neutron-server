import logger from '../../logger';
import elasticServer from './elastic';
import { IElasticUserCreate } from './types';

const createElasticUser = async (user: IElasticUserCreate) => {
  try {
    const response = await elasticServer.put(
      `/_security/user/${user.username}`,
      { ...user }
    );
    logger.info('ES user created successfully:', response.data);
  } catch (error: any) {
    logger.error(`Error creating ES user ${user.email}`, error);
  }
};

export default createElasticUser;
