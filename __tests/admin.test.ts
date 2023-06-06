/* eslint-disable no-plusplus */
import request from 'supertest';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from '../src/app';
import User from '../src/models/User';
import { makeAdminUser, makeUser, withLogin } from './__utils__/user_setup';

describe('Admin controller', () => {
  let adminUser: any = {};
  let adminToken: string = '';
  const result = dotenv.config();
  if (result.error) {
    dotenv.config({ path: '.env.default' });
  }

  beforeEach(async () => {
    await mongoose.connect(process.env.MONGO_URL ?? '');
    const { user, password } = await makeAdminUser();
    adminToken = await withLogin(user.email, password);
    adminUser = user;
  });

  afterEach(async () => {
    User.deleteOne({ email: adminUser.email });
    await mongoose.connection.close();
  });

  it('get all users', async () => {
    const res = await request(app)
      .get('/admin/users')
      .auth(adminToken, { type: 'bearer' });

    expect(res.statusCode).toBe(200);
    expect(res.body.users.length).toBeGreaterThan(1);
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
    const { user } = await makeUser(false);

    const toBeDeleted = await User.findOne({
      email: user.email
    }).exec();

    const rres = await request(app)
      .delete('/admin/user')
      .auth(adminToken, { type: 'bearer' })
      .send({
        id: toBeDeleted?._id
      });

    const usr = await User.findOne({
      email: user.email
    }).exec();

    expect(rres.statusCode).toBe(200);
    expect(usr?.active).toBe(false);
  });

  it.todo('get organizations');

  it.todo('delete organizations');

  it.todo('modify organisation user s right');
});