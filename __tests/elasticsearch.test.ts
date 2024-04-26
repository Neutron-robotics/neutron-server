import mongoose from 'mongoose';
import dotenv from 'dotenv';
import request from 'supertest';
import axios from 'axios';
import app from '../src/app';
import User from '../src/models/User';
import { makeUser, withLogin } from './__utils__/user_setup';

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

    await elasticServer.delete(`/_security/user/${ESUsername}`);

    const { user, password } = await makeUser(true, {
      firstName,
      lastName
    });

    const res = await elasticServer.get(`/_security/user/${ESUsername}`);

    expect(res.status).toBe(200);
    expect(res.data[ESUsername]).toBeDefined();
    expect(res.data[ESUsername].roles).toStrictEqual([]);
  }, 80000);

  it.todo('Create organization and organization role');

  it.todo('Promote user into organization with role');

  it.todo('Demote user into organization with role');
});
