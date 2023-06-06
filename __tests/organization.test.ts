import mongoose from 'mongoose';
import dotenv from 'dotenv';
import request from 'supertest';
import app from '../src/app';
import User from '../src/models/User';
import { makeUser, withLogin } from './__utils__/user_setup';
import {makeOrganization} from './__utils__/organization_setup'

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

  it.todo('create an organization', async () => {
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

    expect(organization.members.length).toBe(1);
    expect(res.statusCode).toBe(200);
  });

  it.todo('get my organizations', async () => {
    const organization = await makeOrganization(token);

    const res = await request(app)
      .get('/organization/me')
      .auth(token, { type: 'bearer' });

    const organizations = await Organization.find({
      company: 'Hugosoft'
    }).exec();

    expect(organization.length).toBe(1);
    expect(res.statusCode).toBe(200);
  });

  it('update an organization', async () => {
    const organization = await makeOrganization(token);

    const res = await request(app)
      .post('/organization/update?company=Hugosoft 2')
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
    expect(organization2.name).toBe('My new organization');
    expect(organization2.company).toBe('Hugosoft 2');
    expect(organization2.description).toBe('This should be a abrupt string to be displayed');
    expect(organization2.imgUrl).toBe('https://static.hugosoft.com/neutron/imgnew.png');
  });

  it.todo('delete an organization (deactivate)' async () => {
    const organization = await makeOrganization(token);

    const res = await request(app)
      .delete('/organization/delete?company=Hugosoft')
      .auth(token, { type: 'bearer' })

    const deleted = await Organization.findOne({
      company: 'Hugosoft'
    }).exec();

    expect(deleted.enabled).toBe(false);
    expect(res.statusCode).toBe(200);
  });

  it.todo('fail to update an organization without appropriate rights' async () => {
    const organization = await makeOrganization(token);
    const { user: notGoodUser, password: pwdForNotGoodUser } = await makeUser(true);
    const notGoodToken = await withLogin(notGoodUser.email, pwdForNotGoodUser);

    const res = await request(app)
      .post('/organization/update?company=Hugosoft 2')
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
    expect(unchanged.name).toBe('My organization');
    expect(unchanged.company).toBe('Hugosoft');
    expect(unchanged.description).toBe('This should be a long string to be displayed');
    expect(unchanged.imgUrl).toBe('https://static.hugosoft.com/neutron/img.png');
  });

  it.todo('fail to delete an organization without appropriate rights', async () => {
    const organization = await makeOrganization(token);
    const { user: notGoodUser, password: pwdForNotGoodUser } = await makeUser(true);
    const notGoodToken = await withLogin(notGoodUser.email, pwdForNotGoodUser);
    
    const res = await request(app)
      .delete(`/organization/delete?company=${organization.company}`)
      .auth(notGoodToken, { type: 'bearer' })

    const notDeleted = await Organization.findOne({
      company: 'Hugosoft'
    }).exec();

    expect(notDeleted.enabled).toBe(true);
    expect(res.statusCode).toBe(401);
  });

  it.todo('grant right to a user for an organization', async () => {
    
  });

  it.todo('ungrant right to a user for an organization');

  it.todo('add a robot to an organization');

  it.todo('remove a robot to an organization');
});
