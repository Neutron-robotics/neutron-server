// eslint-disable-next-line import/no-extraneous-dependencies
import request from 'supertest';
import { generateRandomString } from './string';
import app from '../../src/app';
import User from '../../src/models/User';

const makeUser = async (verify: boolean) => {
  const randomUser = {
    firstName: 'hugo',
    lastName: 'user',
    password: 'toto1234',
    email: `hugo.user@test-${generateRandomString(5)}.com`
  };
  await request(app)
    .post('/auth/register')
    .send(
      {
        firstName: randomUser.firstName,
        lastName: randomUser.lastName,
        password: randomUser.password,
        email: randomUser.email
      }
    );
  const user = await User.findOne({
    email: randomUser.email.toLowerCase()
  }).exec();
  if (verify) {
    await request(app)
      .post(`/auth/verify?key=${user?.activationKey}`);
  }
  if (!user) { throw new Error('The test user failed to be created'); };

  return { user, password: randomUser.password };
};

const makeAdminUser = async () => {
  const adminUser = {
    firstName: 'hugo',
    lastName: 'admin',
    password: 'toto1234',
    email: `hugo.admin@test-${generateRandomString(5)}.com`
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

  const user = await User.findOne({ email: adminUser.email.toLowerCase() }).exec();
  if (user?.roles) {
    user.roles = ['admin'];
    user.active = true;
    await user.save();
  };
  if (!user) { throw new Error('The test admin user failed to be created'); };

  return { user, password: adminUser.password };
};

const deleteUser = async (email: string) => {
  User.deleteOne({ email });
};

const withLogin = async (email: string, password: string) => {
  const me = await request(app)
    .post('/auth/login')
    .send(
      {
        password,
        email
      }
    );
  return me.body.token as string;
};

export {
  makeUser,
  makeAdminUser,
  withLogin,
  deleteUser
};
