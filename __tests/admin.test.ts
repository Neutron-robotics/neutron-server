/* eslint-disable no-plusplus */
import request from 'supertest';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from '../src/app';
import User from '../src/models/User';
import { generateRandomString } from './__utils__/string';

describe('Admin controller', () => {
  let adminUser: any = {};
  const result = dotenv.config();
  if (result.error) {
    dotenv.config({ path: '.env.default' });
  }

  beforeAll(async () => {
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

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('get all users', async () => {
    const res = await request(app)
      .get('/admin/users')
      .auth(`${adminUser.token}`, { type: 'bearer' });

    expect(res.body.users.length).toBeGreaterThan(1);
  });

  it('delete users', async () => {
    const userEmail = `tester.foux@${generateRandomString(5)}.com`;
    await request(app)
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
    const user = await User.find({
      email: userEmail
    }).exec();

    expect(rres.statusCode).toBe(200);
    expect(user.length).toBe(0);
  });
});
