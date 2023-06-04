/* eslint-disable no-plusplus */
import request from 'supertest';
import dotenv from 'dotenv';
import mongoose, { mongo } from 'mongoose';
import app from '../src/app';
import User from '../src/models/User';
import { generateRandomString } from './__utils__/string';

describe('Admin controller', () => {
  let adminUser: any = {};
  const result = dotenv.config();
  if (result.error) {
    dotenv.config({ path: '.env.default' });
  }

  beforeEach(async () => {
    await mongoose.connect(process.env.MONGO_URL ?? '');

    adminUser = {
      firstName: 'hugo',
      lastName: 'test',
      password: 'toto1234',
      email: `hugo.perier@${generateRandomString(5)}.com`
    };
    await request(app)
      .post('/auth/register')
      .send(
        {
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          password: adminUser.password,
          email: adminUser.email
        }
      );

    const user = await User.findOne({ email: adminUser.email }).exec();
    if (user?.roles) {
      user.roles = ['admin'];
      user.active = true;
      await user.save();
    }
    const me = await request(app)
      .post('/auth/login')
      .send(
        {
          password: adminUser.password,
          email: adminUser.email
        }
      );
    adminUser.token = me.body.token;
    adminUser.user = user;
  });

  afterEach(async () => {
    User.deleteOne({ email: adminUser.email });
    await mongoose.connection.close();
  });

  it('get all users', async () => {
    const res = await request(app)
      .get('/admin/users')
      .auth(`${adminUser.token}`, { type: 'bearer' });

    expect(res.body.users.length).toBeGreaterThan(1);
    expect(res.statusCode).toBe(200);
  });

  it('fails to get all users if not admin', async () => {
    const user = await User.findOne({ email: adminUser.email }).exec();
    if (user?.roles) {
      user.roles = [];
      await user.save();
    }

    const me = await request(app)
      .post('/auth/login')
      .send(
        {
          password: adminUser.password,
          email: adminUser.email
        }
      );

    const res = await request(app)
      .get('/admin/users')
      .auth(`${me.body.token}`, { type: 'bearer' });

    expect(res.body.users).not.toBeDefined();
    expect(res.statusCode).toBe(403);
  });

  it('delete users', async () => {
    const userEmail = `tester.foux@${generateRandomString(5)}.com`;
    const r = await request(app)
      .post('/auth/register')
      .send(
        {
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          password: 'tititest',
          email: userEmail
        }
      );

    const toBeDeleted = await User.findOne({
      email: userEmail
    }).exec();

    const rres = await request(app)
      .delete('/admin/user')
      .auth(`${adminUser.token}`, { type: 'bearer' })
      .send({
        id: toBeDeleted?._id
      });

    const user = await User.findOne({
      email: userEmail
    }).exec();

    expect(rres.statusCode).toBe(200);
    expect(user?.active).toBe(false);
  });

  it.todo('get organizations');

  it.todo('delete organizations');

  it.todo('modify organisation user s right');
});
