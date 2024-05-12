import logger from '../../logger';
import { IOrganizationDocument } from '../../models/Organization';
import elasticServer from './elastic';
import kibanaServer from './kibana';

const createOrganizationRole = async (organization: IOrganizationDocument) => {
  const roleName = organization.toElasticRoleName();

  const indices = [
    {
      names: [`neutron-connection-${organization.id}-*`],
      privileges: ['read']
    }
  ];
  const kibanaPrivileges = [
    {
      spaces: ['*'],
      feature: {
        discover: ['all'],
        visualize: ['all'],
        dashboard: ['all']
      }
    }
  ];
  try {
    const response = await kibanaServer.put(`/api/security/role/${roleName}`, {
      elasticsearch: { indices },
      kibana: kibanaPrivileges
    });
    logger.info('Role created successfully:', response.data);
  } catch (error: any) {
    logger.error(`Error creating role ${roleName}`, error);
  }
};

async function addRolesToUser(username: string, roles: string[]) {
  try {
    await elasticServer.post(`/_security/user/${username}`, {
      roles
    });
    logger.info('Roles added successfully.');
  } catch (error: any) {
    logger.error(`Error adding roles ${roles.join(',')} to user ${username}`, error);
  }
}

async function removeRolesFromUser(username: string, roles: string[]) {
  try {
    const elasticUser = await elasticServer.get(`/_security/user/${username}`);
    const elasticUserRolesFiltered = elasticUser.data[username].roles
      .filter((role: string) => !roles.includes(role));

    await elasticServer.post(`/_security/user/${username}`, {
      roles: elasticUserRolesFiltered
    });
    logger.info('Roles removed successfully.');
  } catch (error: any) {
    logger.error(`Error removing roles ${roles.join(',')} from user ${username}`, error);
  }
}

export {
  createOrganizationRole,
  addRolesToUser,
  removeRolesFromUser
};
