import mongoose from 'mongoose';
import dotenv from 'dotenv';
import request from 'supertest';
import { spawn } from 'child_process';
import axios from 'axios';
import app from '../src/app';
import User from '../src/models/User';
import { makeUser, withLogin } from './__utils__/user_setup';
import Connection from '../src/models/Connection';
import { makeRobot } from './__utils__/robot_setup';
import { RobotStatus } from '../src/models/RobotStatus';

jest.mock('axios');
jest.mock('child_process');
describe('Connection tests', () => {
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

  it('create a connection and instanciate process', async () => {
    const { robot } = await makeRobot(token, [], undefined, RobotStatus.Operating);

    const mockAxios = jest.fn();
    (axios.get as any).mockImplementation(mockAxios);
    mockAxios.mockReturnValue(Promise.resolve({
      status: 200
    }));

    (axios.post as any).mockImplementation(mockAxios);
    mockAxios.mockReturnValue(Promise.resolve({
      status: 200
    }));

    const fakePID = 12345;

    (spawn as any).mockImplementation((command: string) => {
      const idRegex = /--id\s(\w+)/;
      const match = command.match(idRegex);
      const id = match && match[1];

      const fakeReadyLine = `neutron connection ${id} ready`;
      return {
        pid: fakePID,
        on: (event: any, callback: any) => {},
        once: (event: any, callback: any) => {},
        stdout: {
          on: (event: any, callback: any) => {
            if (event === 'data') {
              setTimeout(async () => {
                callback(Buffer.from(fakeReadyLine));
              }, 1000);
            }
          }
        }
      };
    });

    const res = await request(app)
      .post('/connection/create')
      .auth(token, { type: 'bearer' })
      .send({
        robotId: robot._id
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.connection.hostname).toBe('localhost');
    expect(res.body.connection.port).toBeDefined();
    expect(res.body.connection.registerId).toBeDefined();
    expect(res.body.connection.connectionId).toBeDefined();
    const connection = await Connection.findById(res.body.connection.connectionId);
    if (!connection) { throw new Error('Connection undefined'); };
    expect(connection).toBeDefined();
    expect(connection.isActive).toBe(true);
    expect(connection.createdBy.toString()).toBe(user._id.toString());
    expect(connection.robotId.toString()).toBe(robot._id.toString());
    expect(connection.pid).toBeDefined();
    expect(connection?.port).toBeDefined();
  });

  it('join an existing connection', async () => {
    const mockAxios = jest.fn();
    (axios.get as any).mockImplementation(mockAxios);
    mockAxios.mockReturnValue(Promise.resolve({
      status: 200
    }));
    (axios.post as any).mockImplementation(mockAxios);
    mockAxios.mockReturnValue(Promise.resolve({
      status: 200
    }));

    const mockSpawn = jest.fn();
    (spawn as any).mockImplementation(mockSpawn);
    const fakePID = 12345;
    const { robot } = await makeRobot(token, [], undefined, RobotStatus.Operating);

    (spawn as any).mockImplementation((command: string) => {
      const idRegex = /--id\s(\w+)/;
      const match = command.match(idRegex);
      const id = match && match[1];

      const fakeReadyLine = `neutron connection ${id} ready`;
      return {
        pid: fakePID,
        on: (event: any, callback: any) => {},
        once: (event: any, callback: any) => {},
        stdout: {
          on: (event: any, callback: any) => {
            if (event === 'data') {
              setTimeout(async () => {
                callback(Buffer.from(fakeReadyLine));
              }, 1000);
            }
          }
        }
      };
    });

    const res = await request(app)
      .post('/connection/create')
      .auth(token, { type: 'bearer' })
      .send({
        robotId: robot._id
      });

    const connection = await Connection.findById(res.body.connection.connectionId);
    expect(connection?.isActive).toBeTruthy();
    expect(connection?.port).toBeDefined();

    const resJoin = await request(app)
      .post(`/connection/join/${connection?._id}`)
      .auth(token, { type: 'bearer' });

    expect(resJoin.statusCode).toBe(200);
    expect(resJoin.body.connection.hostname).toBe('localhost');
    expect(resJoin.body.connection.port).toBeDefined();
    expect(resJoin.body.connection.registerId).toBeDefined();
  });

  it('close an existing connection', async () => {
    const { robot } = await makeRobot(token, [], undefined, RobotStatus.Operating);
    process.kill = jest.fn();
    const mockAxios = jest.fn();
    (axios.get as any).mockImplementation(mockAxios);
    mockAxios.mockReturnValue(Promise.resolve({
      status: 200
    }));
    (axios.post as any).mockImplementation(mockAxios);
    mockAxios.mockReturnValue(Promise.resolve({
      status: 200
    }));

    const mockSpawn = jest.fn();
    (spawn as any).mockImplementation(mockSpawn);
    const fakePID = 12345;
    const fakeReadyLine = 'neutron connection is ready';

    let onCloseCallback = () => {};

    (spawn as any).mockImplementation((command: string) => {
      const idRegex = /--id\s(\w+)/;
      const match = command.match(idRegex);
      const id = match && match[1];

      const fakeReadyLine = `neutron connection ${id} ready`;
      return {
        pid: fakePID,
        on: (event: any, callback: any) => {},
        once: (event: any, callback: any) => {
          if (event === 'close') {
            onCloseCallback = callback;
          }
        },
        stdout: {
          on: (event: any, callback: any) => {
            if (event === 'data') {
              setTimeout(async () => {
                callback(Buffer.from(fakeReadyLine));
              }, 1000);
            }
          }
        }
      };
    });

    const res = await request(app)
      .post('/connection/create')
      .auth(token, { type: 'bearer' })
      .send({
        robotId: robot._id
      });

    const connection = await Connection.findById(res.body.connection.connectionId);
    expect(connection?.isActive).toBeTruthy();

    const resClose = await request(app)
      .post(`/connection/close/${connection?._id}`)
      .auth(token, { type: 'bearer' });

    await onCloseCallback();

    expect(resClose.statusCode).toBe(200);

    const closedConnection = await Connection.findById(res.body.connection.connectionId);
    expect(closedConnection?.isActive).toBeFalsy();
    expect(closedConnection?.closedAt).toBeDefined();
    expect(process.kill).toHaveBeenCalledWith(+(closedConnection?.pid ?? ''), 'SIGINT');
  });

  it('get connection by id', async () => {
    const { robot } = await makeRobot(token, [], undefined, RobotStatus.Operating);

    const connection = new Connection({
      robotId: robot._id,
      isActive: true,
      createdBy: user._id,
      createdAt: new Date(),
      pid: 12345,
      port: 8080
    });
    await connection.save();

    const res = await request(app)
      .get(`/connection/${connection.id}`)
      .auth(token, { type: 'bearer' });

    expect(res.statusCode).toBe(200);
    const connectionDTO = res.body.connection;
    expect(connectionDTO.isActive).toBe(true);
    expect(connectionDTO.createdAt).toBeDefined();
    expect(connectionDTO.closedAt).not.toBeDefined();
    expect(connectionDTO.createdBy).toBe(user.id);
    expect(connectionDTO.pid).not.toBeDefined();
    expect(connectionDTO.port).toBe(8080);

    expect(connectionDTO.robot.secretKey).not.toBeDefined();
    expect(connectionDTO.robot.name).toBeDefined();
    expect(connectionDTO.robot.imgUrl).toBeDefined();
  });

  it('get all my connections', async () => {
    const { robot: robot1 } = await makeRobot(token, [], undefined, RobotStatus.Operating);
    const { robot: robot2 } = await makeRobot(token, [], undefined, RobotStatus.Operating);
    const { robot: robot3 } = await makeRobot(token, [], undefined, RobotStatus.Operating);

    const connection1robot1 = new Connection({
      robotId: robot1._id,
      isActive: true,
      createdBy: user._id,
      createdAt: new Date(),
      pid: 12345,
      port: 8080
    });
    await connection1robot1.save();
    const connection2robot1 = new Connection({
      robotId: robot1._id,
      isActive: false,
      createdBy: user._id,
      createdAt: new Date(),
      pid: 4141,
      port: 8203
    });
    await connection2robot1.save();

    const connection1robot2 = new Connection({
      robotId: robot2._id,
      isActive: true,
      createdBy: user._id,
      createdAt: new Date(),
      pid: 36982,
      port: 15482
    });
    await connection1robot2.save();

    const connection1robot3 = new Connection({
      robotId: robot3._id,
      isActive: false,
      createdBy: user._id,
      createdAt: new Date(),
      pid: 3682,
      port: 1582
    });
    await connection1robot3.save();

    const res = await request(app)
      .get('/connection')
      .auth(token, { type: 'bearer' });

    expect(res.statusCode).toBe(200);

    const { connections } = res.body;
    expect(connections.length).toBe(4);
  });

  it('get all my active connections', async () => {
    const { robot: robot1 } = await makeRobot(token, [], undefined, RobotStatus.Operating);
    const { robot: robot2 } = await makeRobot(token, [], undefined, RobotStatus.Operating);
    const { robot: robot3 } = await makeRobot(token, [], undefined, RobotStatus.Operating);

    const connection1robot1 = new Connection({
      robotId: robot1._id,
      isActive: true,
      createdBy: user._id,
      createdAt: new Date(),
      pid: 12345,
      port: 8080
    });
    await connection1robot1.save();
    const connection2robot1 = new Connection({
      robotId: robot1._id,
      isActive: false,
      createdBy: user._id,
      createdAt: new Date(),
      pid: 4141,
      port: 8203
    });
    await connection2robot1.save();

    const connection1robot2 = new Connection({
      robotId: robot2._id,
      isActive: true,
      createdBy: user._id,
      createdAt: new Date(),
      pid: 36982,
      port: 15482
    });
    await connection1robot2.save();

    const connection1robot3 = new Connection({
      robotId: robot3._id,
      isActive: false,
      createdBy: user._id,
      createdAt: new Date(),
      pid: 3682,
      port: 1582
    });
    await connection1robot3.save();

    const res = await request(app)
      .get('/connection?status=active')
      .auth(token, { type: 'bearer' });

    expect(res.statusCode).toBe(200);

    const { connections } = res.body;
    expect(connections.length).toBe(2);
  });

  it('get all my inactive connections', async () => {
    const { robot: robot1 } = await makeRobot(token, [], undefined, RobotStatus.Operating);
    const { robot: robot2 } = await makeRobot(token, [], undefined, RobotStatus.Operating);
    const { robot: robot3 } = await makeRobot(token, [], undefined, RobotStatus.Operating);

    const connection1robot1 = new Connection({
      robotId: robot1._id,
      isActive: true,
      createdBy: user._id,
      createdAt: new Date(),
      pid: 12345,
      port: 8080
    });
    await connection1robot1.save();
    const connection2robot1 = new Connection({
      robotId: robot1._id,
      isActive: false,
      createdBy: user._id,
      createdAt: new Date(),
      pid: 4141,
      port: 8203
    });
    await connection2robot1.save();

    const connection1robot2 = new Connection({
      robotId: robot2._id,
      isActive: true,
      createdBy: user._id,
      createdAt: new Date(),
      pid: 36982,
      port: 15482
    });
    await connection1robot2.save();

    const connection1robot3 = new Connection({
      robotId: robot3._id,
      isActive: false,
      createdBy: user._id,
      createdAt: new Date(),
      pid: 3682,
      port: 1582
    });
    await connection1robot3.save();

    const res = await request(app)
      .get('/connection?status=active')
      .auth(token, { type: 'bearer' });

    expect(res.statusCode).toBe(200);

    const { connections } = res.body;
    expect(connections.length).toBe(2);
  });
});
