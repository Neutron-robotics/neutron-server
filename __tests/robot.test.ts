import mongoose from 'mongoose';
import dotenv from 'dotenv';
import request from 'supertest';
import { makeUser, withLogin } from './__utils__/user_setup';
import { makeRobot } from './__utils__/robot_setup';
import User from '../src/models/User';
import { generateRandomString } from './__utils__/string';
import app from '../src/app';
import { makeOrganization } from './__utils__/organization_setup';
import Robot, { ConnectionContextType } from '../src/models/Robot';
import Organization from '../src/models/Organization';

describe('robot tests', () => {
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

  it('create a robot with empty parts', async () => {
    const robotName = `test robot ${generateRandomString(6)}`;
    const organization = await makeOrganization(token);

    const res = await request(app)
      .post('/robot/create')
      .auth(token, { type: 'bearer' })
      .send({
        name: robotName,
        parts: [],
        imgUrl: 'https://static.hugosoft.com/robots/test.png',
        description: 'This is a test robot',
        connectionContextType: 'ros2',
        organizationId: organization.id
      });

    const robot = await Robot.findOne({ name: robotName }).exec();
    const orga = await Organization.findOne({ _id: organization.id }).exec();
    expect(orga?.robots.length).toBeGreaterThan(0);
    expect(orga?.robots.map(e => e.toString()).includes(robot?.id.toString())).toBeTruthy();
    expect(res.statusCode).toBe(200);
    expect(robot).toBeDefined();
    expect(robot?.name).toBe(robotName);
    expect(robot?.parts.length).toBe(0);
  });

  it('create a robot with many parts', async () => {
    const robotName = `test organization ${generateRandomString(6)}`;
    const organization = await makeOrganization(token);

    const res = await request(app)
      .post('/robot/create')
      .auth(token, { type: 'bearer' })
      .send({
        name: robotName,
        parts: [
          {
            type: 'RGBCamera',
            category: 'vision',
            name: 'test camera'
          },
          {
            type: 'Grapper',
            category: 'actuator',
            name: 'Robot grab grab',
            imgUrl: 'https://static.neutron.com/robot/wdjxsiushf.png'
          },
          {
            type: 'OsoyooBase',
            category: 'base',
            name: 'robot base',
            imgUrl: 'https://static.neutron.com/robot/base.png'
          }
        ],
        imgUrl: 'https://static.hugosoft.com/robots/test.png',
        description: 'This is another test robot',
        connectionContextType: 'ros2',
        organizationId: organization.id
      });

    const robot = await Robot.findOne({ name: robotName }).exec();
    expect(res.statusCode).toBe(200);
    expect(robot).toBeDefined();
    expect(robot?.linked);
    expect(robot?.name).toBe(robotName);
    expect(robot?.parts.length).toBe(3);
  });

  it('link a robot', async () => {
    const { robot } = await makeRobot(token, []);
    expect(robot.linked).toBe(false);

    const res = await request(app)
      .post('/robot/activate')
      .send({
        secretKey: robot.secretKey
      });

    const activatedRobot = await Robot.findOne({ _id: robot.id }).exec();
    expect(res.statusCode).toBe(200);
    expect(activatedRobot?.linked).toBe(true);
  });

  it('delete a robot', async () => {
    const { robot, organization } = await makeRobot(token, []);

    const res = await request(app)
      .delete(`/robot/${robot.id}`)
      .auth(token, { type: 'bearer' });

    const deletedRobot = await Robot.findOne({ _id: robot.id });
    const organizationWithoutRobot = await Organization.findOne({ _id: organization?.id });
    expect(res.statusCode).toBe(200);
    expect(deletedRobot).toBeNull();
    expect(organizationWithoutRobot?.robots.includes(robot.id)).toBeFalsy();
  });

  it('get robot configuration', async () => {
    const { robot } = await makeRobot(token, []);

    const res = await request(app)
      .get(`/robot/configuration/${robot.secretKey}`);

    const payload = res.body.robot;
    expect(res.statusCode).toBe(200);
    expect(payload.name).toBe(robot.name);
    expect(payload.parts.length).toBe(robot.parts.length);
  });

  it('fail to get robot configuration', async () => {
    const { robot } = await makeRobot(token, []);

    const res = await request(app)
      .get(`/robot/configuration/${robot.id}`);

    expect(res.statusCode).toBe(400);
  });

  it('update a robot', async () => {
    const { robot } = await makeRobot(token, []);
    const robotName = `test robot updated ${generateRandomString(6)}`;

    const res = await request(app)
      .post(`/robot/update/${robot.id}`)
      .auth(token, { type: 'bearer' })
      .send({
        name: robotName,
        imgUrl: 'https://static.hugosoft.com/robots/testupdated.png',
        description: 'This is an updated test robot',
        connectionContextType: 'tcp'
      });

    const robotUpdated = await Robot.findOne({ _id: robot.id }).exec();
    expect(res.statusCode).toBe(200);
    expect(robotUpdated?.name).toBe(robotName);
    expect(robotUpdated?.description).toBe('This is an updated test robot');
    expect(robotUpdated?.imgUrl).toBe('https://static.hugosoft.com/robots/testupdated.png');
    expect(robotUpdated?.context).toBe(ConnectionContextType.Tcp);
  });
});
