/* eslint-disable no-plusplus */
import request from 'supertest';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from '../src/app';
import User from '../src/models/User';
import { generateRandomString } from './__utils__/string';

describe('Authentication controller', () => {
  let randomUser: any = {};
  const result = dotenv.config();
  if (result.error) {
    dotenv.config({ path: '.env.default' });
  }

  const register = async (verify: boolean) => {
    const email = `hugo.test@${generateRandomString(5)}.com`;
    await request(app)
      .post('/auth/register')
      .send(
        {
          firstName: randomUser.firstName,
          lastName: randomUser.lastName,
          password: randomUser.password,
          email
        }
      );

    const userRequest = {
      email,
      firstName: randomUser.firstName,
      lastName: randomUser.lastName,
      password: randomUser.password
    };
    const user = await User.findOne({
      email: userRequest.email.toLowerCase()
    }).exec();

    if (verify) {
      await request(app)
        .post(`/auth/verify?key=${user?.activationKey}`);
    }
    return { userRequest, user };
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
    expect(resp.body.message).toBe('OK');

    const user = await User.findOne({
      email: email.toLowerCase()
    }).exec();

    expect(user?.password?.length).toBeGreaterThan(5);
    expect(user?.password?.length).not.toBe(randomUser.password);
  });

  it('Verify an account', async () => {
    const { user } = await register(false);
    const resp = await request(app)
      .post(`/auth/verify?key=${user?.activationKey}`);

    expect(resp.statusCode).toBe(200);
    expect(resp.body.message).toBe('OK');

    const user2 = await User.find({
      email: user?.email
    }).exec();

    expect(user2.length).toBe(1);
    expect(user2[0].active).toBe(true);
  });

  it('Login to an account', async () => {
    const { userRequest } = await register(true);

    const res = await request(app)
      .post('/auth/login')
      .send(
        {
          email: userRequest.email,
          password: randomUser.password
        }
      );
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('Login to an account that does not exist', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send(
        {
          email: 'doesnotexist@gmail.com',
          password: 'wrongpassword'
        }
      );
    expect(res.statusCode).toBe(404);
  });

  it('Login wrong to an account', async () => {
    const { user } = await register(false);

    const res = await request(app)
      .post('/auth/login')
      .send(
        {
          email: user?.email,
          password: 'wrongpassword'
        }
      );
    expect(res.statusCode).toBe(401);
  });

  it('Register duplicate email', async () => {
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
    const resp2 = await request(app)
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
    expect(resp2.statusCode).toBe(400);

    const user = await User.find({
      email: email.toLowerCase()
    }).exec();

    expect(user.length).toBe(1);
  });

  it('get my account', async () => {
    const { userRequest } = await register(true);

    const login = await request(app)
      .post('/auth/login')
      .send(
        {
          email: userRequest.email,
          password: randomUser.password
        }
      );

    expect(login.statusCode).toBe(200);

    const res = await request(app)
      .get('/auth/me')
      .auth(`${login.body.token}`, { type: 'bearer' });
    expect(res.statusCode).toBe(200);
    const { me } = res.body;
    expect(me.firstName).toBe(userRequest.firstName);
    expect(me.lastName).toBe(userRequest.lastName);
    expect(me.roles).toStrictEqual(['user']);
    expect(me.email).toBe(userRequest.email.toLowerCase());
  });

  it('Verify an account with a wrong code', async () => {
    const { userRequest } = await register(false);

    const resp = await request(app)
      .post('/auth/verify?key=$blablabla');

    expect(resp.statusCode).toBe(401);

    const user = await User.find({
      email: userRequest.email
    }).exec();

    expect(user.length).toBe(1);
    expect(user[0].active).toBe(false);
  });

  it('Reset password of an account', async () => {
    const { userRequest, user } = await register(true);

    const reset = await request(app)
      .post('/auth/reset')
      .send({
        email: userRequest.email.toLowerCase()
      });

    expect(reset.statusCode).toBe(200);

    const userAgain = await User.find({
      email: userRequest.email
    }).exec();

    expect(userAgain[0].activationKey).toBeDefined();
    expect(userAgain.length).toBe(1);
    expect(userAgain[0].password).not.toBe(user?.password);
  });

  it('update account', async () => {
    const { userRequest, user } = await register(true);

    const login = await request(app)
      .post('/auth/login')
      .send(
        {
          email: userRequest.email,
          password: randomUser.password
        }
      );
    expect(login.statusCode).toBe(200);

    const newEmail = `${generateRandomString(5)}jajaja@test.com`;

    const update = await request(app)
      .post('/auth/update')
      .send({
        email: newEmail,
        password: 'testtoo'
      }).auth(`${login.body.token}`, { type: 'bearer' });

    expect(update.statusCode).toBe(200);

    const userAgain = await User.find({
      email: newEmail
    }).exec();

    const oldUser = await User.find({
      email: userRequest.email
    }).exec();

    expect(oldUser.length).toBe(0);
    expect(userAgain.length).toBe(1);
    expect(userAgain[0].email).toBe(newEmail.toLowerCase());
    expect(userAgain[0].password).not.toBe(user?.password);
    expect(userAgain[0].firstName).toBe(user?.firstName);
    expect(userAgain[0].lastName).toBe(user?.lastName);
  });

  it('fails to create duplicate account', async () => {
    const { userRequest } = await register(false);
    const res2 = await request(app)
      .post('/auth/register')
      .send(
        {
          firstName: randomUser.firstName,
          lastName: randomUser.lastName,
          password: randomUser.password,
          email: userRequest.email
        }
      );
    const users = await User.find({
      email: userRequest.email
    }).exec();

    expect(users.length).toBe(1);
    expect(res2.statusCode).toBe(400);
  });

  it('delete an account', async () => {
    const { userRequest } = await register(true);

    const login = await request(app)
      .post('/auth/login')
      .send(
        {
          email: userRequest.email,
          password: userRequest.password
        }
      );
    expect(login.statusCode).toBe(200);

    const rres = await request(app)
      .delete('/auth/delete')
      .auth(`${login.body.token}`, { type: 'bearer' })
      .send({
        email: userRequest.email
      });
    const user = await User.find({
      email: userRequest.email
    }).exec();

    expect(rres.statusCode).toBe(200);
    expect(user.length).toBe(0);
  });

  it('fails delete a foreign account', async () => {
    const { userRequest } = await register(true);

    const rres = await request(app)
      .delete('/auth/delete')
      .send({
        email: userRequest.email
      });
    const user = await User.findOne({
      email: userRequest.email
    }).exec();

    expect(rres.statusCode).toBe(401);
    expect(user).toBeDefined();
  });
});
