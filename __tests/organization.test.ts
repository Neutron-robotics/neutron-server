import mongoose from 'mongoose';
import dotenv from 'dotenv';
import request from 'supertest';
import app from '../src/app';
import User from '../src/models/User';
import { makeUser, withLogin } from './__utils__/user_setup';
import { makeOrganization } from './__utils__/organization_setup';
import Organization from '../src/models/Organization';

describe('organization tests', () => {
  let user: any = {};
  let token: string = '';
  const result = dotenv.config();
  if (result.error) {
    dotenv.config({ path: '.env.default' });
  }

  beforeEach(async () => {
    await mongoose.connect(process.env.MONGO_URL ?? '');
    const { user: usr, password } = await makeUser(true);
    token = await withLogin(usr.email, password);
    user = usr;
  });

  afterEach(async () => {
    User.deleteOne({ email: user.email });
    await mongoose.connection.close();
  });

  it('create an organization', async () => {
    const res = await request(app)
      .post('/organization/create')
      .auth(token, { type: 'bearer' })
      .send({
        name: 'My organization',
        company: 'Hugosoft',
        description: 'This should be a long string to be displayed',
        imgUrl: 'https://static.hugosoft.com/neutron/img.png'
      });

    const organization = await Organization.findOne({
      company: 'Hugosoft'
    }).exec();

    expect(organization?.users.length).toBe(1);
    expect(res.statusCode).toBe(200);
  });

  it('get my organizations', async () => {
    await makeOrganization(token);

    const res = await request(app)
      .get('/organization/me')
      .auth(token, { type: 'bearer' });

    const organizations = await Organization.find({
      company: 'Hugosoft'
    }).exec();

    expect(organizations.length).toBe(1);
    expect(res.statusCode).toBe(200);
  });

  it('update an organization', async () => {
    const organization = await makeOrganization(token);

    const res = await request(app)
      .post(`/organization/${organization.name}/company=Hugosoft 2`)
      .auth(token, { type: 'bearer' })
      .send({
        name: 'My new organization',
        company: 'Hugosoft 2',
        description: 'This should be a abrupt string to be displayed',
        imgUrl: 'https://static.hugosoft.com/neutron/imgnew.png'
      });

    const organization2 = await Organization.findOne({
      company: 'Hugosoft 2'
    }).exec();

    expect(res.statusCode).toBe(200);
    expect(organization2?.name).toBe('My new organization');
    expect(organization2?.company).toBe('Hugosoft 2');
    expect(organization2?.description).toBe('This should be a abrupt string to be displayed');
    expect(organization2?.imgUrl).toBe('https://static.hugosoft.com/neutron/imgnew.png');
  });

  it('delete an organization (deactivate)', async () => {
    const organization = await makeOrganization(token);

    const res = await request(app)
      .delete(`/organization/${organization.name}/delete`)
      .auth(token, { type: 'bearer' });

    const deleted = await Organization.findOne({
      company: 'Hugosoft'
    }).exec();

    expect(deleted?.active).toBe(false);
    expect(res.statusCode).toBe(200);
  });

  it('fail to update an organization without appropriate rights', async () => {
    const organization = await makeOrganization(token);
    const { user: notGoodUser, password: pwdForNotGoodUser } = await makeUser(true);
    const notGoodToken = await withLogin(notGoodUser.email, pwdForNotGoodUser);

    const res = await request(app)
      .post(`/organization/${organization.name}/update`)
      .auth(notGoodToken, { type: 'bearer' })
      .send({
        name: 'My new organization',
        company: 'Hugosoft 2',
        description: 'This should be a abrupt string to be displayed',
        imgUrl: 'https://static.hugosoft.com/neutron/imgnew.png'
      });

    const unchanged = await Organization.findOne({
      company: 'Hugosoft 2'
    }).exec();

    expect(organization.enabled).toBe(true);
    expect(res.statusCode).toBe(401);
    expect(unchanged?.name).toBe('My organization');
    expect(unchanged?.company).toBe('Hugosoft');
    expect(unchanged?.description).toBe('This should be a long string to be displayed');
    expect(unchanged?.imgUrl).toBe('https://static.hugosoft.com/neutron/img.png');
  });

  it('fail to delete an organization without appropriate rights', async () => {
    const organization = await makeOrganization(token);
    const { user: notGoodUser, password: pwdForNotGoodUser } = await makeUser(true);
    const notGoodToken = await withLogin(notGoodUser.email, pwdForNotGoodUser);

    const res = await request(app)
      .delete(`/organization/${organization.company}/delete`)
      .auth(notGoodToken, { type: 'bearer' });

    const notDeleted = await Organization.findOne({
      company: 'Hugosoft'
    }).exec();

    expect(notDeleted?.active).toBe(true);
    expect(res.statusCode).toBe(401);
  });

  it('grant right to a user for an organization', async () => {
    const organization = await makeOrganization(token);
    const { user: granterUser } = await makeUser(true);

    const res = await request(app)
      .delete('/organization/promote')
      .auth(token, { type: 'bearer' })
      .send({
        user: granterUser.email,
        right: 'operator'
      });

    const organization2 = await Organization.findOne({
      company: organization.company
    }).exec();
    expect(organization2?.users.find(e => e.userId === granterUser.id && e.permissions.includes('operator'))).toBe(true);
    expect(res.statusCode).toBe(200);
  });

  it('ungrant right to a user for an organization', async () => {
    const organization = await makeOrganization(token);
    const { user: grantedUser, password: grantedUserPassword } = await makeUser(true);

    const res = await request(app)
      .delete('/organization/promote')
      .auth(token, { type: 'bearer' })
      .send({
        user: grantedUser.email,
        right: 'guest'
      });

    let organizationgr = await Organization.findOne({
      company: organization.company
    }).exec();
    expect(organization.users.find(e => e.userId === grantedUser._id && e.rights.include('operator'))).toBe(true);
    expect(res.statusCode).toBe(200);

    const resRemove = await request(app)
      .delete('/organization/promote')
      .auth(token, { type: 'bearer' })
      .send({
        user: grantedUser.email,
        remove: true
      });

    organizationgr = await Organization.findOne({
      company: organization.company
    }).exec();
    expect(organization.users.find(e => e.userId === grantedUser._id)).toBe(false);
    expect(resRemove.statusCode).toBe(200);
  });

  it('transfer ownership of an organization', async () => {

  });

  it.todo('add a robot to an organization');

  it.todo('remove a robot to an organization');
});
