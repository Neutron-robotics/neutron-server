import mongoose from 'mongoose';
import dotenv from 'dotenv';
import request from 'supertest';
import { makeUser, withLogin } from './__utils__/user_setup';
import { makeRobot } from './__utils__/robot_setup';
import User from '../src/models/User';
import { generateRandomString } from './__utils__/string';
import app from '../src/app';
import { makeOrganization } from './__utils__/organization_setup';
import Robot from '../src/models/Robot';

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
    const robotName = `test organization ${generateRandomString(6)}`;
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
        organizationId: organization
      });

    const robot = await Robot.findOne({ name: robotName }).exec();
    expect(res.statusCode).toBe(200);
    expect(robot).toBeDefined();
    expect(robot?.name).toBe(robotName);
    expect(robot?.parts.length).toBe(0);
  });

  it.todo('create a robot with many parts');

  it.todo('activate a robot');

  it.todo('delete a robot');

  it.todo('get robot configuration');

  it.todo('fail to get robot configuration');

  it.todo('update a robot');
});
