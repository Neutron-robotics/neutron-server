import mongoose from 'mongoose';
import dotenv from 'dotenv';
import request from 'supertest';
import app from '../src/app';
import User from '../src/models/User';
import { makeUser, withLogin } from './__utils__/user_setup';
import { makeOrganization } from './__utils__/organization_setup';
import Organization from '../src/models/Organization';
import { generateRandomString } from './__utils__/string';
import { makeRobot } from './__utils__/robot_setup';
import { RobotPartCategory } from '../src/models/Robot';

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
    const orgName = `test organization ${generateRandomString(4)}`;
    const res = await request(app)
      .post('/organization/create')
      .auth(token, { type: 'bearer' })
      .send({
        name: orgName,
        company: 'Hugosoft',
        description: 'This should be a long string to be displayed',
        imgUrl: 'https://static.hugosoft.com/neutron/img.png'
      });

    const organization = await Organization.findOne({
      name: orgName
    }).exec();

    expect(organization?.users.length).toBe(1);
    expect(res.statusCode).toBe(200);
    await Organization.deleteOne({ name: orgName }).exec();
  });

  it('get my organizations', async () => {
    const organization = await makeOrganization(token);

    const res = await request(app)
      .get('/organization/me')
      .auth(token, { type: 'bearer' });

    const organizations = await Organization.find({
      name: organization.name
    }).exec();

    expect(organizations.length).toBe(1);
    expect(res.statusCode).toBe(200);
    await Organization.deleteOne({ name: organization.name }).exec();
  });

  it('update an organization', async () => {
    const organization = await makeOrganization(token);
    const newName = `test organization ${generateRandomString(4)}`;

    const res = await request(app)
      .post(`/organization/${organization.name}/update`)
      .auth(token, { type: 'bearer' })
      .send({
        name: newName,
        company: 'Hugosoft 2',
        description: 'This should be a abrupt string to be displayed',
        imgUrl: 'https://static.hugosoft.com/neutron/imgnew.png'
      });

    const organization2 = await Organization.findOne({
      name: organization.name
    }).exec();

    const organizationUpdated = await Organization.findOne({
      name: newName
    }).exec();

    expect(organization2).toBeNull();
    expect(res.statusCode).toBe(200);
    expect(organizationUpdated?.name).toBe(newName);
    expect(organizationUpdated?.company).toBe('Hugosoft 2');
    expect(organizationUpdated?.description).toBe(
      'This should be a abrupt string to be displayed'
    );
    expect(organizationUpdated?.imgUrl).toBe(
      'https://static.hugosoft.com/neutron/imgnew.png'
    );
    await Organization.deleteOne({ name: organizationUpdated?.name }).exec();
  });

  it('delete an organization (deactivate)', async () => {
    const organization = await makeOrganization(token);

    const res = await request(app)
      .delete(`/organization/${organization.name}/delete`)
      .auth(token, { type: 'bearer' });

    const deleted = await Organization.findOne({
      name: organization.name
    }).exec();

    expect(res.statusCode).toBe(200);
    expect(deleted?.active).toBe(false);
  });

  it('fail to update an organization without appropriate rights', async () => {
    const organization = await makeOrganization(token);
    const { user: notGoodUser, password: pwdForNotGoodUser } = await makeUser(
      true
    );
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
      name: organization.name
    }).exec();

    expect(organization.active).toBe(true);
    expect(res.statusCode).toBe(403);
    expect(unchanged?.company).toBe('Hugosoft');
    expect(unchanged?.description).toBe(
      'This should be a long string to be displayed'
    );
    expect(unchanged?.imgUrl).toBe(
      'https://static.hugosoft.com/neutron/img.png'
    );
    await Organization.deleteOne({ name: organization.name }).exec();
  });

  it('fail to delete an organization without appropriate rights', async () => {
    const organization = await makeOrganization(token);
    const { user: notGoodUser, password: pwdForNotGoodUser } = await makeUser(
      true
    );
    const notGoodToken = await withLogin(notGoodUser.email, pwdForNotGoodUser);

    const res = await request(app)
      .delete(`/organization/${organization.name}/delete`)
      .auth(notGoodToken, { type: 'bearer' });

    const notDeleted = await Organization.findOne({
      name: organization.name
    }).exec();

    expect(notDeleted?.active).toBe(true);
    expect(res.statusCode).toBe(403);
    await Organization.deleteOne({ name: organization.name }).exec();
  });

  it('grant right to a user for an organization', async () => {
    const organization = await makeOrganization(token);
    const { user: granterUser } = await makeUser(true);

    const res = await request(app)
      .post(`/organization/${organization.name}/promote`)
      .auth(token, { type: 'bearer' })
      .send({
        user: granterUser.email,
        role: 'operator'
      });

    const organization2 = await Organization.findOne({
      name: organization.name
    }).exec();
    expect(organization2).toBeDefined();
    expect(
      organization2?.users.find(
        e => e.userId.toString() === granterUser.id.toString()
          && e.permissions.includes('operator')
      )
    ).toBeDefined();
    expect(res.statusCode).toBe(200);
    await Organization.deleteOne({ name: organization.name }).exec();
  });

  it('remove a user from an organization', async () => {
    const organization = await makeOrganization(token);
    const { user: grantedUser, password: grantedUserPassword } = await makeUser(
      true
    );

    const res = await request(app)
      .post(`/organization/${organization.name}/promote`)
      .auth(token, { type: 'bearer' })
      .send({
        user: grantedUser.email,
        role: 'operator'
      });

    let organizationgr = await Organization.findOne({
      name: organization.name
    }).exec();
    expect(
      organizationgr?.users.find(
        e => e.userId.toString() === grantedUser._id.toString()
          && e.permissions.includes('operator')
      )
    ).toBeDefined();
    expect(res.statusCode).toBe(200);

    const resRemove = await request(app)
      .post(`/organization/${organization.name}/demote`)
      .auth(token, { type: 'bearer' })
      .send({
        user: grantedUser.email
      });

    organizationgr = await Organization.findOne({
      name: organization.name
    }).exec();
    expect(
      organizationgr?.users.find(
        e => e.userId.toString() === grantedUser._id.toString()
      )
    ).not.toBeDefined();
    expect(resRemove.statusCode).toBe(200);
    await Organization.deleteOne({ name: organization.name }).exec();
  });

  it('transfer ownership of an organization', async () => {
    const organization = await makeOrganization(token);
    const { user: granterUser } = await makeUser(true);

    const res = await request(app)
      .post(`/organization/${organization.name}/promote`)
      .auth(token, { type: 'bearer' })
      .send({
        user: granterUser.email,
        role: 'owner'
      });

    const organization2 = await Organization.findOne({
      name: organization.name
    }).exec();
    expect(organization2).toBeDefined();
    // Granter user is now the owner
    expect(
      organization2?.users.find(
        e => e.userId.toString() === granterUser.id.toString()
          && e.permissions.includes('owner')
      )
    ).toBeDefined();
    // User became admin
    expect(
      organization2?.users.find(
        e => e.userId.toString() === user.id.toString()
          && e.permissions.includes('admin')
      )
    ).toBeDefined();
    expect(res.statusCode).toBe(200);

    expect(
      organization2?.users.filter(e => e.permissions.includes('owner')).length
    ).toBe(1);

    await Organization.deleteOne({ name: organization.name }).exec();
  });

  it('get member for an organization', async () => {
    const organization = await makeOrganization(token);
    const { user: granterUser } = await makeUser(true);

    const res = await request(app)
      .post(`/organization/${organization.name}/promote`)
      .auth(token, { type: 'bearer' })
      .send({
        user: granterUser.email,
        role: 'operator'
      });

    expect(res.statusCode).toBe(200);

    const getMemberById = await request(app)
      .get(`/organization/${organization.name}/getMember?userId=${granterUser.id}`)
      .auth(token, { type: 'bearer' })
      .send();

    expect(getMemberById.statusCode).toBe(200);
    expect(getMemberById.body.user).toStrictEqual({
      id: granterUser.id,
      email: granterUser.email,
      firstName: granterUser.firstName,
      lastName: granterUser.lastName
    });

    const getMemberByEmail = await request(app)
      .get(`/organization/${organization.name}/getMember?email=${granterUser.email}`)
      .auth(token, { type: 'bearer' })
      .send();

    expect(getMemberByEmail.statusCode).toBe(200);
    expect(getMemberByEmail.body.user).toStrictEqual({
      id: granterUser.id,
      email: granterUser.email,
      firstName: granterUser.firstName,
      lastName: granterUser.lastName
    });
  });

  it('get organization robots', async () => {
    const partr1name = generateRandomString(4);
    const partr2name = generateRandomString(4);
    const { robot, organization } = await makeRobot(token, [{
      type: 'camera',
      category: RobotPartCategory.Vison,
      name: `P-${partr1name}`,
      imgUrl: `localhost:3003/${generateRandomString(4)}`
    }]);
    const { robot: secondRobot } = await makeRobot(token, [{
      type: 'robot base',
      category: RobotPartCategory.Base,
      name: `P-${partr2name}`,
      imgUrl: `localhost:3003/${generateRandomString(4)}`
    }], organization?.name);

    const res = await request(app)
      .get(`/organization/${organization?.name}/robots`)
      .auth(token, { type: 'bearer' });

    expect(res.statusCode).toBe(200);
    expect(res.body.robots.length).toBe(2);
    expect(res.body.robots[0].name).toBe(robot.name);
    expect(res.body.robots[0].description).toBe(robot.description);
    expect(res.body.robots[0].secretKey).not.toBeDefined();
    expect(res.body.robots[0].parts.length).toBe(1);

    expect(res.body.robots[1].name).toBe(secondRobot.name);
    expect(res.body.robots[1].description).toBe(secondRobot.description);
    expect(res.body.robots[1].secretKey).not.toBeDefined();
    expect(res.body.robots[1].parts.length).toBe(1);
  });
});
