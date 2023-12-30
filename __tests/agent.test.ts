import mongoose from 'mongoose';
import dotenv from 'dotenv';
import request from 'supertest';
import { createHash } from 'crypto';
import { makeRobot } from './__utils__/robot_setup';
import { makeUser, withLogin } from './__utils__/user_setup';
import Robot from '../src/models/Robot';
import app from '../src/app';
import { PublishSystemInformationRequest } from '../src/controllers/agent/publishSystemInformation';
import RobotStatusModel, { RobotStatus } from '../src/models/RobotStatus';

describe('agent test', () => {
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
    await mongoose.connection.close();
  });

  it('link agent', async () => {
    const { robot } = await makeRobot(token, []);
    expect(robot.linked).toBe(false);

    const res = await request(app)
      .post('/agent/link')
      .send({
        secretKey: robot.secretKey
      });

    const activatedRobot = await Robot.findOne({ _id: robot.id }).exec();
    expect(res.statusCode).toBe(200);
    expect(activatedRobot?.linked).toBe(true);
  });

  it('fails to link agent because already linked', async () => {
    const { robot } = await makeRobot(token, []);
    expect(robot.linked).toBe(false);

    const res = await request(app)
      .post('/agent/link')
      .send({
        secretKey: robot.secretKey
      });

    const activatedRobot = await Robot.findOne({ _id: robot.id }).exec();
    expect(res.statusCode).toBe(200);
    expect(activatedRobot?.linked).toBe(true);

    const res2 = await request(app)
      .post('/agent/link')
      .send({
        secretKey: robot.secretKey
      });

    expect(res2.statusCode).toBe(400);
  });

  it('publish robot status', async () => {
    const { robot } = await makeRobot(token, []);

    await request(app)
      .post('/agent/link')
      .send({
        secretKey: robot.secretKey
      });

    const robotConfig = {
      name: robot.name,
      context: {
        type: robot.context
      },
      parts: robot.parts.map(e => ({
        id: e._id,
        name: e.name,
        category: e.category,
        ros2Node: e.ros2Node,
        ros2Package: e.ros2Package
      }))
    };
    const configStr = JSON.stringify(robotConfig, Object.keys(robotConfig).sort());
    const hash = createHash('sha256').update(configStr).digest('hex');

    const info: PublishSystemInformationRequest = {
      secretKey: robot.secretKey,
      status: {
        status: RobotStatus.Online,
        battery: {
          level: 100,
          charging: true
        },
        hash
      }
    };

    const systemInfos = await request(app)
      .post('/agent/publishSystemInformation')
      .send(info);

    const status = await RobotStatusModel.find({ robot: robot.id });

    expect(systemInfos.statusCode).toBe(200);
    expect(systemInfos.body.configuration).not.toBeDefined();
    expect(status.length).toBe(1);
    expect(status[0].status).toBe(RobotStatus.Online);
    expect(status[0].battery!.level).toBe(100);
    expect(status[0].battery!.charging).toBe(true);
    expect(status[0].robot.toString()).toBe(robot._id.toString());
    expect(status[0].system).not.toBeDefined();
  });
});
