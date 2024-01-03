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
    const mockAxios = jest.fn();
    (axios.get as any).mockImplementation(mockAxios);
    mockAxios.mockReturnValue(Promise.resolve({
      status: 200
    }));

    const fakePID = 12345;
    const fakeReadyLine = 'neutron connection is ready';

    (spawn as any).mockReturnValue({
      pid: fakePID,
      on: (event: any, callback: any) => {},
      once: (event: any, callback: any) => {},
      stdout: {
        on: (event: any, callback: any) => {
          if (event === 'data') {
            setTimeout(() => {
              callback(Buffer.from(fakeReadyLine));
            }, 1000);
          }
        }
      }
    });

    const { robot } = await makeRobot(token, []);

    const res = await request(app)
      .post('/connection/create')
      .auth(token, { type: 'bearer' })
      .send({
        robotId: robot._id,
        robotPort: 8080
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.connection.hostname).toBe('localhost');
    expect(res.body.connection.port).toBeDefined();
    expect(res.body.connection.registerId).toBeDefined();
    expect(res.body.connection._id).toBeDefined();
    const connection = await Connection.findById(res.body.connection._id);
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
    const mockSpawn = jest.fn();
    (spawn as any).mockImplementation(mockSpawn);
    const fakePID = 12345;
    const fakeReadyLine = 'neutron connection is ready';
    const { robot } = await makeRobot(token, []);

    mockSpawn.mockReturnValue({
      pid: fakePID,
      on: (event: any, callback: any) => {},
      once: (event: any, callback: any) => {},
      stdout: {
        on: (event: any, callback: any) => {
          if (event === 'data') {
            setTimeout(() => {
              callback(Buffer.from(fakeReadyLine));
            }, 1000);
          }
        }
      }
    });

    const res = await request(app)
      .post('/connection/create')
      .auth(token, { type: 'bearer' })
      .send({
        robotId: robot._id,
        robotPort: 8080
      });

    const connection = await Connection.findById(res.body.connection._id);
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
    const { robot } = await makeRobot(token, []);
    process.kill = jest.fn();
    const mockAxios = jest.fn();
    (axios.get as any).mockImplementation(mockAxios);
    mockAxios.mockReturnValue(Promise.resolve({
      status: 200
    }));
    const mockSpawn = jest.fn();
    (spawn as any).mockImplementation(mockSpawn);
    const fakePID = 12345;
    const fakeReadyLine = 'neutron connection is ready';

    let onCloseCallback = () => {};
    mockSpawn.mockReturnValue({
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
            setTimeout(() => {
              callback(Buffer.from(fakeReadyLine));
            }, 1000);
          }
        }
      }
    });

    const res = await request(app)
      .post('/connection/create')
      .auth(token, { type: 'bearer' })
      .send({
        robotId: robot._id,
        robotPort: 8080
      });

    const connection = await Connection.findById(res.body.connection._id);
    expect(connection?.isActive).toBeTruthy();

    const resClose = await request(app)
      .post(`/connection/close/${connection?._id}`)
      .auth(token, { type: 'bearer' });

    await onCloseCallback();

    expect(resClose.statusCode).toBe(200);

    const closedConnection = await Connection.findById(res.body.connection._id);
    expect(closedConnection?.isActive).toBeFalsy();
    expect(closedConnection?.closedAt).toBeDefined();
    expect(process.kill).toHaveBeenCalledWith(+(closedConnection?.pid ?? ''), 'SIGINT');
  });
});
