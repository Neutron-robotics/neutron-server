import mongoose from 'mongoose';
import dotenv from 'dotenv';
import request from 'supertest';
import axios from 'axios';
import { makeUser, withLogin } from './__utils__/user_setup';
import { makeRobot } from './__utils__/robot_setup';
import User from '../src/models/User';
import { generateRandomString } from './__utils__/string';
import app from '../src/app';
import { makeOrganization } from './__utils__/organization_setup';
import Robot, { ConnectionContextType } from '../src/models/Robot';
import Organization from '../src/models/Organization';
import { RobotPartCategory } from '../src/models/RobotPart';
import Ros2SystemModel from '../src/models/Ros2/Ros2System';
import { PublishSystemInformationRequest } from '../src/controllers/agent/publishSystemInformation';
import { RobotStatus } from '../src/models/RobotStatus';
import { sleep } from '../src/utils/time';

jest.mock('axios');
jest.mock('../src/utils/nodemailer/sendEmail', () => jest.fn());

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
    expect(robot?.linked).toBe(false);
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
    expect(robot?.linked).toBe(false);
    expect(robot?.name).toBe(robotName);
    expect(robot?.parts.length).toBe(3);
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

  it('Create a Ros2System when robot is created', async () => {
    const { robot } = await makeRobot(token, []);

    const ros2system = await Ros2SystemModel.findOne({ robotId: robot.id });
    expect(ros2system).not.toBeNull();
  });

  it('get latest robot status', async () => {
    const { robot } = await makeRobot(token, []);

    await request(app)
      .post('/agent/link')
      .send({
        secretKey: robot.secretKey
      });

    const info: PublishSystemInformationRequest = {
      secretKey: robot.secretKey,
      status: {
        status: RobotStatus.Online,
        battery: {
          level: 100,
          charging: true
        },
        hash: robot.generateHash()
      }
    };

    await request(app)
      .post('/agent/publishSystemInformation')
      .send(info);

    await sleep(100);
    await request(app)
      .post('/agent/publishSystemInformation')
      .send({ ...info, status: { ...info.status, status: RobotStatus.Unknown } });

    await sleep(100);
    await request(app)
      .post('/agent/publishSystemInformation')
      .send({ ...info, status: { ...info.status, status: RobotStatus.Offline } });

    const res = await request(app)
      .get(`/robot/status/${robot.id}`)
      .auth(token, { type: 'bearer' });

    const { status } = res.body;

    expect(res.statusCode).toBe(200);
    expect(status.status).toBe('Offline');
    expect(status.system).toBe(undefined);
    expect(status.battery.level).toBe(100);
    expect(status.battery.charging).toBe(true);
  });

  it('Get robot by id', async () => {
    const { robot, organization } = await makeRobot(token, []);

    const res = await request(app)
      .get(`/robot/${robot.id}`)
      .auth(token, { type: 'bearer' })
      .send();

    const robotRes = res.body.robot;
    expect(res.statusCode).toBe(200);
    expect(robotRes).toBeDefined();
    expect(robotRes.secretKey).toBeDefined();
  });

  it('Get all robots of a user', async () => {
    const { robot } = await makeRobot(token, []);

    const res = await request(app)
      .get('/user/me/robots')
      .auth(token, { type: 'bearer' });

    const robotsRes = res.body.robots;
    expect(res.statusCode).toBe(200);
    expect(robotsRes).toBeDefined();
    expect(robotsRes.length).toBe(1);
    expect(robotsRes[0]._id).toBe(robot.id);
    expect(robotsRes[0].status).not.toBeDefined();
  });

  it('Get all robots of a user with status', async () => {
    const { robot } = await makeRobot(token, []);
    const { robot: robot2 } = await makeRobot(token, []);

    await request(app)
      .post('/agent/link')
      .send({
        secretKey: robot.secretKey
      });
    await request(app)
      .post('/agent/link')
      .send({
        secretKey: robot2.secretKey
      });

    const info: PublishSystemInformationRequest = {
      secretKey: robot.secretKey,
      status: {
        status: RobotStatus.Online,
        battery: {
          level: 100,
          charging: true
        },
        hash: robot.generateHash()
      }
    };
    await request(app)
      .post('/agent/publishSystemInformation')
      .send(info);

    const res = await request(app)
      .get('/user/me/robots?includeStatus=true')
      .auth(token, { type: 'bearer' });

    const robotsRes = res.body.robots;
    expect(res.statusCode).toBe(200);
    expect(robotsRes).toBeDefined();
    expect(robotsRes.length).toBe(2);
    expect(robotsRes[0]._id).toBe(robot.id);
    expect(robotsRes[0].status).toBeDefined();
    expect(robotsRes[1]._id).toBe(robot2.id);
    expect(robotsRes[1].status).toBeNull();
  });

  it('should start a robot', async () => {
    const { robot } = await makeRobot(token, []);

    const mockAxios = jest.fn();
    (axios.post as any).mockImplementation(mockAxios);
    mockAxios.mockReturnValue(Promise.resolve({
      status: 200
    }));

    const res = await request(app)
      .post(`/robot/start/${robot.id}`)
      .auth(token, { type: 'bearer' });

    expect(res.statusCode).toBe(200);
    expect(mockAxios).toHaveBeenCalledWith('http://undefined:8000/robot/start', {});
  });

  it('should stop a robot', async () => {
    const { robot } = await makeRobot(token, []);

    const mockAxios = jest.fn();
    (axios.post as any).mockImplementation(mockAxios);
    mockAxios.mockReturnValue(Promise.resolve({
      status: 200
    }));

    const res = await request(app)
      .post(`/robot/stop/${robot.id}`)
      .auth(token, { type: 'bearer' });

    expect(res.statusCode).toBe(200);
    expect(mockAxios).toHaveBeenCalledWith('http://undefined:8000/robot/stop', {});
  });

  it('should start a robot with parts', async () => {
    const { robot } = await makeRobot(token, [
      {
        type: 'RGBCamera',
        category: RobotPartCategory.Vison,
        name: 'test camera',
        imgUrl: 'https://static.neutron.com/robot/w.png'
      },
      {
        type: 'Grapper',
        category: RobotPartCategory.Actuator,
        name: 'Robot grab grab',
        imgUrl: 'https://static.neutron.com/robot/wdjxsiushf.png'
      }
    ]);

    const mockAxios = jest.fn();
    (axios.post as any).mockImplementation(mockAxios);
    mockAxios.mockReturnValue(Promise.resolve({
      status: 200
    }));

    const res = await request(app)
      .post(`/robot/start/${robot.id}`)
      .auth(token, { type: 'bearer' })
      .send({
        partsId: robot.parts.map(e => e._id)
      });

    expect(res.statusCode).toBe(200);
    expect(mockAxios).toHaveBeenCalledWith('http://undefined:8000/robot/start', {
      processesId: [robot.parts[0]._id, robot.parts[1]._id]
    });
  });

  it('should throw a NotFound error if the robot does not exist', async () => {
    const mockAxios = jest.fn();
    (axios.post as any).mockImplementation(mockAxios);
    mockAxios.mockReturnValue(Promise.resolve({
      status: 200
    }));

    const res = await request(app)
      .post(`/robot/start/${new mongoose.Types.ObjectId()}`)
      .auth(token, { type: 'bearer' });

    expect(res.statusCode).toBe(404);
    expect(mockAxios).not.toHaveBeenCalled();
  });

  it('should throw an error if the robot cannot be started', async () => {
    const { robot } = await makeRobot(token, []);
    const mockAxios = jest.fn();
    (axios.post as any).mockImplementation(mockAxios);
    mockAxios.mockReturnValue(Promise.resolve({
      status: 500,
      data: {
        message: 'error'
      }
    }));

    const res = await request(app)
      .post(`/robot/start/${robot.id}`)
      .auth(token, { type: 'bearer' });

    expect(res.statusCode).toBe(500);
    expect(res.body).toStrictEqual({
      error: '[object Object]'
    });
    expect(mockAxios).toHaveBeenCalled();
  });
});

describe('part tests', () => {
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

  it('Create a part', async () => {
    const { robot } = await makeRobot(token, []);

    const res = await request(app)
      .post(`/robot/${robot.id}/part/create`)
      .auth(token, { type: 'bearer' })
      .send({
        type: 'test',
        imgUrl: 'https://static.hugosoft.com/part/testpart.png',
        name: 'My test part',
        category: RobotPartCategory.Actuator
      });

    const robotUpdated = await Robot.findOne({ _id: robot.id }).exec();
    expect(res.statusCode).toBe(200);
    expect(robotUpdated?.parts.length).toBe(1);

    const part = robotUpdated?.parts[0];
    expect(part?.type).toBe('test');
    expect(part?.imgUrl).toBe('https://static.hugosoft.com/part/testpart.png');
    expect(part?.name).toBe('My test part');
    expect(part?.category).toBe(RobotPartCategory.Actuator);
  });

  it('Update a part', async () => {
    const { robot } = await makeRobot(token, [
      {
        type: 'RGBCamera',
        category: RobotPartCategory.Vison,
        name: 'test camera',
        imgUrl: 'https://static.neutron.com/robot/w.png'
      },
      {
        type: 'Grapper',
        category: RobotPartCategory.Actuator,
        name: 'Robot grab grab',
        imgUrl: 'https://static.neutron.com/robot/wdjxsiushf.png'
      }
    ]);

    const robotCreated = await Robot.findOne({ _id: robot.id });
    const res = await request(app)
      .post(`/robot/${robot.id}/part/${robotCreated?.parts[0]._id}/update`)
      .auth(token, { type: 'bearer' })
      .send({
        type: 'test',
        imgUrl: 'https://static.hugosoft.com/part/testpart.png',
        name: 'My test part',
        category: RobotPartCategory.Actuator
      });

    const robotUpdated = await Robot.findOne({ _id: robot.id });
    const partUpdated = robotUpdated?.parts[0];
    expect(res.statusCode).toBe(200);
    expect(partUpdated?.type).toBe('test');
    expect(partUpdated?.imgUrl).toBe('https://static.hugosoft.com/part/testpart.png');
    expect(partUpdated?.name).toBe('My test part');
    expect(partUpdated?.category).toBe(RobotPartCategory.Actuator);
  });

  it('Delete a part', async () => {
    const { robot } = await makeRobot(token, [
      {
        type: 'RGBCamera',
        category: RobotPartCategory.Vison,
        name: 'test camera',
        imgUrl: 'https://static.neutron.com/robot/w.png'
      },
      {
        type: 'Grapper',
        category: RobotPartCategory.Actuator,
        name: 'Robot grab grab',
        imgUrl: 'https://static.neutron.com/robot/wdjxsiushf.png'
      }
    ]);

    const res = await request(app)
      .delete(`/robot/${robot.id}/part/${robot?.parts[0]._id}`)
      .auth(token, { type: 'bearer' });

    const robotPartDeleted = await Robot.findOne({ _id: robot.id });
    expect(res.statusCode).toBe(200);
    expect(robotPartDeleted?.parts.length).toBe(1);
  });
});
