/* eslint-disable no-console */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import request from 'supertest';
import axios from 'axios';
import app from '../src/app';
import User from '../src/models/User';
import { makeUser, withLogin } from './__utils__/user_setup';
import { makeOrganization } from './__utils__/organization_setup';

describe('Elasticsearch integration tests', () => {
  const result = dotenv.config();
  if (result.error) {
    dotenv.config({ path: '.env.default' });
  }

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

  const elasticServer = axios.create({
    baseURL: process.env.ELASTIC_HOSTNAME,
    auth: {
      username: process.env.NEUTRON_ADMIN_ELK_USERNAME ?? '',
      password: process.env.NEUTRON_ADMIN_ELK_PASSWORD ?? ''
    }
  });

  beforeEach(async () => {
    await mongoose.connect(process.env.MONGO_URL ?? '');
  });

  afterEach(async () => {
    await mongoose.connection.close();
  });

  it('Create user and ES user', async () => {
    const firstName = 'testuser';
    const lastName = 'elastic';
    const ESUsername = `${firstName}-${lastName}`;

    try {
      await elasticServer.delete(`/_security/user/${ESUsername}`);
    } catch {
      console.log('test user already deleted');
    }

    const { user, password } = await makeUser(true, {
      firstName,
      lastName
    });

    const res = await elasticServer.get(`/_security/user/${ESUsername}`);

    expect(res.status).toBe(200);
    expect(res.data[ESUsername]).toBeDefined();
    expect(res.data[ESUsername].roles).toStrictEqual([]);
  }, 80000);

  it('Create organization and organization role', async () => {
    const firstName = 'testuser-org';
    const lastName = 'elastic';
    const ESUsername = `${firstName}-${lastName}`;
    try {
      await elasticServer.delete(`/_security/user/${ESUsername}`);
    } catch (e: any) {
      console.log('test user already deleted');
    }
    const { user, password } = await makeUser(true, {
      firstName,
      lastName
    });
    const token = await withLogin(user.email, password);

    const org = await makeOrganization(token);

    let res:any = {};
    res = await elasticServer.get(`/_security/user/${ESUsername}`);

    const roleName = org.toElasticIndexName();

    expect(res.status).toBe(200);
    expect(res.data[ESUsername]).toBeDefined();
    expect(res.data[ESUsername].roles).toStrictEqual([roleName]);
  }, 80000);

  it('Promote user into organization with role', async () => {
    const firstName = 'testuser-org';
    const lastName = 'elastic';
    const ESUsername = `${firstName}-${lastName}`;

    const firstNamePromoted = 'testuser-promoted';
    const lastNamePromoted = 'elastic';
    const ESUsernamePromoted = `${firstNamePromoted}-${lastNamePromoted}`;

    try {
      await elasticServer.delete(`/_security/user/${ESUsername}`);
    } catch (e: any) {
      console.log('test user already deleted');
    }
    try {
      await elasticServer.delete(`/_security/user/${ESUsernamePromoted}`);
    } catch (e: any) {
      console.log('test user already deleted');
    }

    const { user, password } = await makeUser(true, {
      firstName,
      lastName
    });
    const {
      user: promotedUser,
      password: promotedUserPassword
    } = await makeUser(true, {
      firstName: firstNamePromoted,
      lastName: lastNamePromoted
    });

    const token = await withLogin(user.email, password);
    const org = await makeOrganization(token);

    const promoteRes = await request(app)
      .post(`/organization/${org.name}/promote`)
      .auth(token, { type: 'bearer' })
      .send({
        user: promotedUser.email,
        role: 'analyst'
      });

    let res:any = {};
    res = await elasticServer.get(`/_security/user/${ESUsernamePromoted}`);

    const roleName = org.toElasticIndexName();

    expect(promoteRes.status).toBe(200);
    expect(res.status).toBe(200);
    expect(res.data[ESUsernamePromoted]).toBeDefined();
    expect(res.data[ESUsernamePromoted].roles).toStrictEqual([roleName]);
  });

  it('Demote user into organization with role', async () => {
    const firstName = 'testuser-org';
    const lastName = 'elastic';
    const ESUsername = `${firstName}-${lastName}`;

    const firstNamePromoted = 'testuser-promoted';
    const lastNamePromoted = 'elastic';
    const ESUsernamePromoted = `${firstNamePromoted}-${lastNamePromoted}`;
    try {
      await elasticServer.delete(`/_security/user/${ESUsername}`);
    } catch (e: any) {
      console.log('test user already deleted');
    }
    try {
      await elasticServer.delete(`/_security/user/${ESUsernamePromoted}`);
    } catch (e: any) {
      console.log('test user already deleted');
    }

    const { user, password } = await makeUser(true, {
      firstName,
      lastName
    });
    const {
      user: promotedUser,
      password: promotedUserPassword
    } = await makeUser(true, {
      firstName: firstNamePromoted,
      lastName: lastNamePromoted
    });

    const token = await withLogin(user.email, password);
    const org = await makeOrganization(token);

    const promoteRes = await request(app)
      .post(`/organization/${org.name}/promote`)
      .auth(token, { type: 'bearer' })
      .send({
        user: promotedUser.email,
        role: 'analyst'
      });

    const demoteRes = await request(app)
      .post(`/organization/${org.name}/demote`)
      .auth(token, { type: 'bearer' })
      .send({
        user: promotedUser.email
      });

    const res = await elasticServer.get(`/_security/user/${ESUsernamePromoted}`);

    expect(promoteRes.status).toBe(200);
    expect(demoteRes.status).toBe(200);
    expect(res.status).toBe(200);
    expect(res.data[ESUsernamePromoted]).toBeDefined();
    expect(res.data[ESUsernamePromoted].roles).toStrictEqual([]);
  });
});
