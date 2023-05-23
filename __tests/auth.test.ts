/* eslint-disable no-plusplus */
import request from 'supertest';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from '../src/app';

describe('Authentication controller', () => {
  function generateRandomString(n: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < n; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return result;
  }
  let randomUser: any = {};
  const result = dotenv.config();
  if (result.error) {
    dotenv.config({ path: '.env.default' });
  }

  const register = async (verify: boolean) => {
    const email = `hugo.test@${generateRandomString(5)}.com`;
    const rres = await request(app)
      .post('/auth/register')
      .send(
        {
          firstName: randomUser.firstName,
          lastName: randomUser.lastName,
          password: randomUser.password,
          email
        }
      );
    const createdUser = {
      email: rres.body.user.email,
      password: rres.body.user.password,
      firstName: rres.body.user.firstName,
      lastName: rres.body.user.lastName,
      activationKey: rres.body.user.activationKey,
      active: rres.body.user.active,
      _id: rres.body.user._id
    };

    if (verify) {
      await request(app)
        .post(`/auth/verify?key=${createdUser.activationKey}`);
    }
    return createdUser;
  };

  beforeEach(async () => {
    await mongoose.connect(process.env.MONGO_URL ?? '');

    randomUser = {
      firstName: 'hugo',
      lastName: 'test',
      password: 'toto1234',
      email: `hugo.perier@${generateRandomString(5)}.com`
    };
  });

  afterEach(async () => {
    await mongoose.connection.close();
  });

  it('Create an account', async () => {
    const email = `hugo.test@${generateRandomString(5)}.com`;
    const resp = await request(app)
      .post('/auth/register')
      .send(
        {
          firstName: randomUser.firstName,
          lastName: randomUser.lastName,
          password: randomUser.password,
          email
        }
      );

    expect(resp.statusCode).toBe(200);
    expect(resp.body.user.email).toBe(email.toLowerCase());
    expect(resp.body.user.password).not.toBe(randomUser.password);
    expect(resp.body.user.password.length).toBeGreaterThan(5);
    expect(resp.body.user.firstName).toBe(randomUser.firstName);
    expect(resp.body.user.lastName).toBe(randomUser.lastName);
    expect(resp.body.user.active).toBe(false);
    expect(resp.body.user._id).toBeDefined();
  });

  it('Verify an account', async () => {
    const createdUser = await register(false);
    const resp = await request(app)
      .post(`/auth/verify?key=${createdUser.activationKey}`);

    expect(resp.statusCode).toBe(200);
    expect(resp.body.message).toBe('OK');
  });

  it('Login to an account', async () => {
    const createdUser = await register(true);

    const res = await request(app)
      .post('/auth/login')
      .send(
        {
          email: createdUser.email,
          password: randomUser.password
        }
      );
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('OK');
  });

  it('Login wrong to an account', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send(
        {
          email: randomUser.email,
          password: 'wrongpassword'
        }
      );
    expect(res.statusCode).toBe(404);
  });

  // it.todo('Verify an account that does not exist');
  // it.todo('Reset an account');
  // it.todo('create duplicate account');
  // it.todo('delete an account');
});
