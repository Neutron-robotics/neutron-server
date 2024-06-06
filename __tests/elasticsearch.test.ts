/* eslint-disable no-console */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import request from 'supertest';
import axios from 'axios';
import app from '../src/app';
import User from '../src/models/User';
import { makeUser, withLogin } from './__utils__/user_setup';
import { makeOrganization } from './__utils__/organization_setup';
import { makeRobot } from './__utils__/robot_setup';
import Robot from '../src/models/Robot';

describe('Elasticsearch integration tests', () => {
  it('dev', () => {
    expect(1).toBe(1);
  });

  // const result = dotenv.config();
  // if (result.error) {
  //   dotenv.config({ path: '.env.default' });
  // }

  // const kibanaServer = axios.create({
  //   baseURL: process.env.KIBANA_HOSTNAME,
  //   auth: {
  //     username: process.env.NEUTRON_ADMIN_ELK_USERNAME ?? '',
  //     password: process.env.NEUTRON_ADMIN_ELK_PASSWORD ?? ''
  //   },
  //   headers: {
  //     'kbn-xsrf': 'reporting'
  //   },
  //   validateStatus: () => true
  // });

  // const elasticServer = axios.create({
  //   baseURL: process.env.ELASTIC_HOSTNAME,
  //   auth: {
  //     username: process.env.NEUTRON_ADMIN_ELK_USERNAME ?? '',
  //     password: process.env.NEUTRON_ADMIN_ELK_PASSWORD ?? ''
  //   },
  //   validateStatus: () => true
  // });

  // beforeEach(async () => {
  //   await mongoose.connect(process.env.MONGO_URL ?? '');
  // });

  // afterEach(async () => {
  //   await mongoose.connection.close();
  // });

  // it('Create user and ES user', async () => {
  //   const firstName = `testuser-${generateRandomString(8)}`;
  //   const lastName = 'elastic';
  //   const ESUsername = `${firstName}-${lastName}`.replace(/\s/g, '');

  //   try {
  //     await elasticServer.delete(`/_security/user/${ESUsername}`);
  //   } catch (err: any) {
  //     console.log('test user already deleted');
  //   }

  //   const { user, password } = await makeUser(true, {
  //     firstName,
  //     lastName
  //   });

  //   const res = await elasticServer.get(`/_security/user/${ESUsername}`);

  //   expect(res.status).toBe(200);
  //   expect(res.data[ESUsername]).toBeDefined();
  //   expect(res.data[ESUsername].roles).toStrictEqual([]);
  //   expect(user.elasticUsername).toBe(ESUsername);
  // }, 80000);

  // it('Create organization and organization role', async () => {
  //   const firstName = `testuser-${generateRandomString(8)}`;
  //   const lastName = 'elastic';
  //   const ESUsername = `${firstName}-${lastName}`;
  //   try {
  //     await elasticServer.delete(`/_security/user/${ESUsername}`);
  //   } catch (e: any) {
  //     console.log('test user already deleted');
  //   }
  //   const { user, password } = await makeUser(true, {
  //     firstName,
  //     lastName
  //   });
  //   const token = await withLogin(user.email, password);

  //   const org = await makeOrganization(token);

  //   let res:any = {};
  //   res = await elasticServer.get(`/_security/user/${ESUsername}`);

  //   const roleName = org.toElasticRoleName();

  //   expect(res.status).toBe(200);
  //   expect(res.data[ESUsername]).toBeDefined();
  //   expect(res.data[ESUsername].roles).toStrictEqual([roleName]);
  // }, 80000);

  // it('Promote user into organization with role', async () => {
  //   const firstName = `testuser-${generateRandomString(8)}`;
  //   const lastName = 'elastic';
  //   const ESUsername = `${firstName}-${lastName}`;

  //   const firstNamePromoted = `testuser-promoted-${generateRandomString(8)}`;
  //   const lastNamePromoted = 'elastic';
  //   const ESUsernamePromoted = `${firstNamePromoted}-${lastNamePromoted}`;

  //   try {
  //     await elasticServer.delete(`/_security/user/${ESUsername}`);
  //   } catch (e: any) {
  //     console.log('test user already deleted');
  //   }
  //   try {
  //     await elasticServer.delete(`/_security/user/${ESUsernamePromoted}`);
  //   } catch (e: any) {
  //     console.log('test user already deleted');
  //   }

  //   const { user, password } = await makeUser(true, {
  //     firstName,
  //     lastName
  //   });
  //   const {
  //     user: promotedUser,
  //     password: promotedUserPassword
  //   } = await makeUser(true, {
  //     firstName: firstNamePromoted,
  //     lastName: lastNamePromoted
  //   });

  //   const token = await withLogin(user.email, password);
  //   const org = await makeOrganization(token);

  //   const promoteRes = await request(app)
  //     .post(`/organization/${org.name}/promote`)
  //     .auth(token, { type: 'bearer' })
  //     .send({
  //       user: promotedUser.email,
  //       role: 'analyst'
  //     });

  //   let res:any = {};
  //   res = await elasticServer.get(`/_security/user/${ESUsernamePromoted}`);

  //   const roleName = org.toElasticRoleName();

  //   expect(promoteRes.status).toBe(200);
  //   expect(res.status).toBe(200);
  //   expect(res.data[ESUsernamePromoted]).toBeDefined();
  //   expect(res.data[ESUsernamePromoted].roles).toStrictEqual([roleName]);
  // });

  // it('Demote user into organization with role', async () => {
  //   const firstName = `testuser-${generateRandomString(8)}`;
  //   const lastName = 'elastic';
  //   const ESUsername = `${firstName}-${lastName}`;

  //   const firstNamePromoted = `testuser-promoted-${generateRandomString(8)}`;
  //   const lastNamePromoted = 'elastic';
  //   const ESUsernamePromoted = `${firstNamePromoted}-${lastNamePromoted}`;
  //   try {
  //     await elasticServer.delete(`/_security/user/${ESUsername}`);
  //   } catch (e: any) {
  //     console.log('test user already deleted');
  //   }
  //   try {
  //     await elasticServer.delete(`/_security/user/${ESUsernamePromoted}`);
  //   } catch (e: any) {
  //     console.log('test user already deleted');
  //   }

  //   const { user, password } = await makeUser(true, {
  //     firstName,
  //     lastName
  //   });
  //   const {
  //     user: promotedUser,
  //     password: promotedUserPassword
  //   } = await makeUser(true, {
  //     firstName: firstNamePromoted,
  //     lastName: lastNamePromoted
  //   });

  //   const token = await withLogin(user.email, password);
  //   const org = await makeOrganization(token);

  //   const promoteRes = await request(app)
  //     .post(`/organization/${org.name}/promote`)
  //     .auth(token, { type: 'bearer' })
  //     .send({
  //       user: promotedUser.email,
  //       role: 'analyst'
  //     });

  //   const demoteRes = await request(app)
  //     .post(`/organization/${org.name}/demote`)
  //     .auth(token, { type: 'bearer' })
  //     .send({
  //       user: promotedUser.email
  //     });

  //   const res = await elasticServer.get(`/_security/user/${ESUsernamePromoted}`);

  //   expect(promoteRes.status).toBe(200);
  //   expect(demoteRes.status).toBe(200);
  //   expect(res.status).toBe(200);
  //   expect(res.data[ESUsernamePromoted]).toBeDefined();
  //   expect(res.data[ESUsernamePromoted].roles).toStrictEqual([]);
  // });

  // it('Creating a robot creates a dashboard', async () => {
  //   const { user, password } = await makeUser(true);
  //   const token = await withLogin(user.email, password);

  //   const { organization, robot } = await makeRobot(token, []);

  //   const res = await kibanaServer.get(`/api/saved_objects/dashboard/${robot.id}`);

  //   expect(res.status).toBe(200);
  //   expect(res.data.attributes.title).toBe(`${organization?.name} Organization - ${robot.name}`);
  // });

  // it('Deleting the robot also delete the dashboard', async () => {
  //   const { user, password } = await makeUser(true);
  //   const token = await withLogin(user.email, password);

  //   const { robot } = await makeRobot(token, []);

  //   const res = await request(app)
  //     .delete(`/robot/${robot.id}`)
  //     .auth(token, { type: 'bearer' });

  //   const deletedRobot = await Robot.findOne({ _id: robot.id });
  //   const resKibana = await kibanaServer.get(`/api/saved_objects/dashboard/${robot.id}`);

  //   expect(res.statusCode).toBe(200);
  //   expect(deletedRobot).toBeNull();
  //   expect(resKibana.status).toBe(404);
  // }, 9000000);
});
