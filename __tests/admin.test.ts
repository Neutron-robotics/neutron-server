import request from 'supertest';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from '../src/app';
import User, { UserRole } from '../src/models/User';
import { makeAdminUser, makeUser, withLogin } from './__utils__/user_setup';
import sendEmail from '../src/utils/nodemailer/sendEmail';
import { generateRandomString } from '../src/utils/random';

jest.mock('../src/utils/nodemailer/sendEmail', () => jest.fn());

jest.mock('../src/api/elasticsearch/dataview', () => ({
  deleteDataViewByIndexPattern: jest.fn(),
  createDataView: jest.fn().mockReturnValue(Promise.resolve('toto'))
}));

jest.mock('../src/api/elasticsearch/connectionDashboard', () => ({
  deleteDashboard: jest.fn(),
  createConnectionDashboard: jest.fn()
}));

jest.mock('../src/api/elasticsearch/roles', () => ({
  createOrganizationRole: jest.fn(),
  addRolesToUser: jest.fn(),
  removeRolesFromUser: jest.fn()
}));

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
    await User.deleteOne({ email: adminUser.email });
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
    if (user?.role) {
      user.role = UserRole.User;
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

  it('update a user', async () => {
    const { user } = await makeUser(false);
    const newFirstName = 'NewFirstName';
    const newLastName = 'NewLastName';
    const newEmail = `test-${generateRandomString(8)}@new.com`.toLocaleLowerCase();
    const newActive = true;
    const newRole = UserRole.Verified;

    const res = await request(app)
      .post(`/admin/user/${user.id}/update`)
      .auth(adminToken, { type: 'bearer' })
      .send({
        firstName: newFirstName,
        lastName: newLastName,
        email: newEmail,
        active: newActive,
        role: newRole
      });

    expect(res.statusCode).toBe(200);

    const updatedUser = await User.findById(user.id);
    expect(updatedUser?.firstName).toBe(newFirstName);
    expect(updatedUser?.lastName).toBe(newLastName);
    expect(updatedUser?.email).toBe(newEmail);
    expect(updatedUser?.active).toBe(newActive);
    expect(updatedUser?.role).toStrictEqual(newRole);
  });

  it('invite a user', async () => {
    const res = await request(app)
      .post('/admin/inviteUser')
      .auth(adminToken, { type: 'bearer' })
      .send({
        email: 'invite@test.com'
      });

    expect(res.statusCode).toBe(200);
    expect(sendEmail).toHaveBeenCalledWith({
      subject: 'Register to Neutron',
      template: 'register',
      templateArgs: {
        '{{NEUTRON_CREATE_ACCOUNT_LINK}}': expect.stringContaining('http://localhost:5173/register/')
      },
      to: 'invite@test.com'
    });
  });

  it.todo('get organizations');

  it.todo('delete organizations');

  it.todo('modify organisation user s right');
});
