import request from 'supertest';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from '../src/app';
import User from '../src/models/User';
import { generateRandomString } from './__utils__/string';
import { deleteUser, makeUser, withLogin } from './__utils__/user_setup';
import Token, { TokenCategory } from '../src/models/Token';
import sendEmail from '../src/utils/nodemailer/sendEmail';

jest.mock('../src/utils/nodemailer/sendEmail', () => jest.fn());

describe('Authentication controller', () => {
  let randomUserProps: any = {};

  const result = dotenv.config();
  if (result.error) {
    dotenv.config({ path: '.env.default' });
  }

  beforeEach(async () => {
    await mongoose.connect(process.env.MONGO_URL ?? '');

    randomUserProps = {
      firstName: 'hugo',
      lastName: 'test',
      password: 'toto1234',
      email: `hugo.user@test-${generateRandomString(5)}.com`
    };
  });

  afterEach(async () => {
    await mongoose.connection.close();
  });

  it('Create an account', async () => {
    const email = `hugo.test@test-${generateRandomString(5)}.com`;
    const token = await Token.create({ category: TokenCategory.AccountCreation });

    const resp = await request(app)
      .post('/auth/register')
      .send(
        {
          firstName: randomUserProps.firstName,
          lastName: randomUserProps.lastName,
          password: randomUserProps.password,
          email,
          registrationKey: token.key
        }
      );

    expect(resp.statusCode).toBe(200);
    expect(resp.body.message).toBe('OK');

    const user = await User.findOne({
      email: email.toLowerCase()
    }).exec();

    expect(user?.active).toBe(true);
    expect(user?.password?.length).toBeGreaterThan(5);
    expect(user?.password?.length).not.toBe(randomUserProps.password);
    expect(sendEmail).toHaveBeenCalledWith({
      subject: 'Verify your email',
      template: 'verify',
      templateArgs: {
        '{{NEUTRON_VERIFY_LINK}}': `http://localhost:5173/verify/${user?.activationKey}`
      },
      to: user?.email
    });

    // cleanup
    await deleteUser(email);
  });

  it('Verify an account', async () => {
    const { user } = await makeUser(false);
    const resp = await request(app)
      .post(`/auth/verify?key=${user?.activationKey}`);

    expect(resp.statusCode).toBe(200);
    expect(resp.body.message).toBe('OK');

    const user2 = await User.find({
      email: user?.email
    }).exec();

    expect(user2.length).toBe(1);
    expect(user2[0].role).toBe('verified');

    // cleanup
    await deleteUser(user.email);
  });

  it('Login to an account', async () => {
    const { user, password } = await makeUser(true);

    const res = await request(app)
      .post('/auth/login')
      .send(
        {
          email: user?.email,
          password
        }
      );
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();

    // cleanup
    await deleteUser(user.email);
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
    const { user } = await makeUser(false);

    const res = await request(app)
      .post('/auth/login')
      .send(
        {
          email: user?.email,
          password: 'wrongpassword'
        }
      );
    expect(res.statusCode).toBe(401);

    // cleanup
    await deleteUser(user.email);
  });

  it('refresh jwt', async () => {
    const { user, password } = await makeUser(true);
    const token = await withLogin(user.email, password);

    const resp = await request(app)
      .post('/auth/refresh-token')
      .auth(token, { type: 'bearer' });

    const refreshedToken = resp.body.token;

    const res = await request(app)
      .get('/auth/me')
      .auth(refreshedToken, { type: 'bearer' });

    const { me } = res.body;
    expect(res.statusCode).toBe(200);
    expect(me.firstName).toBe(user?.firstName);
    expect(me.lastName).toBe(user?.lastName);
    expect(me.role).toBe('verified');
    expect(me.email).toBe(user?.email);
    await deleteUser(user.email);
  });

  it('fails to register with duplicate email', async () => {
    const { user } = await makeUser(false);
    const resp = await request(app)
      .post('/auth/register')
      .send(
        {
          firstName: 'notimportant',
          lastName: 'notimportant',
          password: 'notimportant',
          email: user?.email
        }
      );

    const usrs = await User.find({
      email: user?.email.toLowerCase()
    }).exec();

    expect(resp.statusCode).toBe(400);
    expect(usrs.length).toBe(1);

    // cleanup
    await deleteUser(user.email);
  });

  it('get my account', async () => {
    const { user, password } = await makeUser(true);
    const token = await withLogin(user.email, password);

    const res = await request(app)
      .get('/auth/me')
      .auth(token, { type: 'bearer' });
    expect(res.statusCode).toBe(200);
    const { me } = res.body;
    expect(me.firstName).toBe(user?.firstName);
    expect(me.lastName).toBe(user?.lastName);
    expect(me.role).toBe('verified');
    expect(me.email).toBe(user?.email);

    // cleanup
    await deleteUser(user.email);
  });

  it('Verify an account with a wrong code', async () => {
    const { user } = await makeUser(false);

    const resp = await request(app)
      .post('/auth/verify?key=$blablabla');

    expect(resp.statusCode).toBe(401);

    const usr = await User.find({
      email: user?.email
    }).exec();

    expect(usr.length).toBe(1);
    expect(usr[0].role).not.toBe('verified');

    // cleanup
    await deleteUser(user.email);
  });

  it('Reset password of an account', async () => {
    const { user } = await makeUser(true);

    const reset = await request(app)
      .post('/auth/reset')
      .send({
        email: user?.email
      });

    expect(reset.statusCode).toBe(200);

    const userAgain = await User.find({
      email: user?.email
    }).exec();

    expect(userAgain[0].activationKey).toBeDefined();
    expect(userAgain.length).toBe(1);
    expect(userAgain[0].password).not.toBe(user?.password);

    // cleanup
    await deleteUser(user.email);
  });

  it('update account', async () => {
    const { user, password } = await makeUser(true);
    const token = await withLogin(user?.email, password);

    const newEmail = `${generateRandomString(5)}jajaja@test.com`;

    const update = await request(app)
      .post('/auth/update')
      .send({
        email: newEmail,
        password: 'testtoo'
      }).auth(token, { type: 'bearer' });

    expect(update.statusCode).toBe(200);

    const userAgain = await User.find({
      email: newEmail
    }).exec();

    const oldUser = await User.find({
      email: user.email
    }).exec();

    expect(oldUser.length).toBe(0);
    expect(userAgain.length).toBe(1);
    expect(userAgain[0].email).toBe(newEmail.toLowerCase());
    expect(userAgain[0].password).not.toBe(user?.password);
    expect(userAgain[0].firstName).toBe(user?.firstName);
    expect(userAgain[0].lastName).toBe(user?.lastName);

    // cleanup
    await deleteUser(newEmail.toLowerCase());
  });

  it('delete my account (deactivate)', async () => {
    const { user, password } = await makeUser(true);
    const token = await withLogin(user.email, password);

    const rres = await request(app)
      .delete('/auth/delete')
      .auth(token, { type: 'bearer' });

    const usrs = await User.find({
      email: user.email
    }).exec();

    expect(rres.statusCode).toBe(200);
    expect(usrs.length).toBe(1);
    expect(usrs[0].active).toBe(false);
  });

  it('Login must fails on a disabled account', async () => {
    const { user, password } = await makeUser(false);
    const token = await withLogin(user.email, password);

    const rres = await request(app)
      .delete('/auth/delete')
      .auth(token, { type: 'bearer' });

    expect(rres.statusCode).toBe(200);

    const res = await request(app)
      .post('/auth/login')
      .send(
        {
          email: user?.email,
          password
        }
      );
    expect(res.statusCode).toBe(401);

    // cleanup
    await deleteUser(user.email);
  });
});
