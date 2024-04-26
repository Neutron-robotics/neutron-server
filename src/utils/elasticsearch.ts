import axios from 'axios';
import logger from '../logger';

const elasticServer = axios.create({
  baseURL: process.env.ELASTIC_HOSTNAME,
  auth: {
    username: process.env.NEUTRON_ADMIN_ELK_USERNAME ?? '',
    password: process.env.NEUTRON_ADMIN_ELK_PASSWORD ?? ''
  }
});

const kibanaServer = axios.create({
  baseURL: process.env.KIBANA_HOSTNAME,
  auth: {
    username: process.env.NEUTRON_ADMIN_ELK_USERNAME ?? '',
    password: process.env.NEUTRON_ADMIN_ELK_PASSWORD ?? ''
  },
  headers: {
    'kbn-xsrf': 'reporting'
  }
});

interface IElasticUserCreate {
    username: string
    password_hash: string
    email: string
    roles: string[]
}

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

const createOrganizationRole = async (organizationName: string) => {
  const roleName = `organization-${organizationName}`;
  const indices = [
    {
      names: [`neutron-connection-${organizationName}-*`],
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
    logger.error('Error creating role:', error.response.data);
  }
};

async function addRolesToUser(username: string, roles: string[]) {
  try {
    await kibanaServer.put(`/api/security/users/${username}/_roles`, {
      roles
    });
    logger.info('Roles added successfully.');
  } catch (error: any) {
    logger.error('Error adding roles:', error.response.data);
  }
}

// Function to remove roles from a user
async function removeRolesFromUser(username: string, roles: string[]) {
  try {
    await kibanaServer.delete(`/api/security/users/${username}/_roles`, {
      data: {
        roles
      }
    });
    logger.info('Roles removed successfully.');
  } catch (error: any) {
    logger.error('Error removing roles:', error.response.data);
  }
}

export {
  createElasticUser,
  createOrganizationRole,
  addRolesToUser,
  removeRolesFromUser
};
