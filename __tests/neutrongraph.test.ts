import mongoose from 'mongoose';
import dotenv from 'dotenv';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { makeUser, withLogin } from './__utils__/user_setup';
import User from '../src/models/User';
import app from '../src/app';
import { flow } from './__mixture__/neutronGraphs';
import { makeRobot } from './__utils__/robot_setup';
import { RobotPartCategory } from '../src/models/RobotPart';
import { IRos2Mock, ros2Mocks } from './__utils__/ros2_setup';

describe('Neutron graph controller', () => {
  let user: any = {};
  let token: string = '';
  let ros2Mock: IRos2Mock;
  const result = dotenv.config();
  if (result.error) {
    dotenv.config({ path: '.env.default' });
  }

  beforeEach(async () => {
    await mongoose.connect(process.env.MONGO_URL ?? '');
    const { user: usr, password } = await makeUser(true);
    token = await withLogin(usr.email, password);
    user = usr;
    ros2Mock = await ros2Mocks(token, {
      type: 'Grapper',
      category: RobotPartCategory.Actuator,
      name: 'Robot grab grab',
      imgUrl: 'https://static.neutron.com/robot/wdjxsiushf.png'
    });
  });

  afterEach(async () => {
    User.deleteOne({ email: user.email });
    await ros2Mock.cleanUp();
    await mongoose.connection.close();
  });

  it('create a new graph', async () => {
    const newGraphModel = {
      ...flow,
      robotId: ros2Mock.robot.id,
      partId: ros2Mock.robot.parts[0].id,
      title: `test graph ${randomUUID()}`
    };

    const res = await request(app)
      .post('/graph/create')
      .auth(token, { type: 'bearer' })
      .send(newGraphModel);

    const graph = await NeutronGraph.findOne({ _id: res.body.id });
    expect(res.body.id).toBeDefined();
    expect(res.statusCode).toBe(200);
    expect(graph.title).toBe(newGraphModel.title);
    expect(graph.robotId).toBe(ros2Mock.robot.id);
    expect(graph.partId).toBe(ros2Mock.robot.parts[0].id);
  });

  it('get user\'s graphs', async () => {
    const newGraphModel = {
      ...flow,
      robotId: ros2Mock.robot.id,
      partId: ros2Mock.robot.parts[0].id,
      title: `test graph ${randomUUID()}`
    };

    const res = await request(app)
      .post('/graph/create')
      .auth(token, { type: 'bearer' })
      .send(newGraphModel);

    const graph = await request(app)
      .get('/graph/me')
      .auth(token, { type: 'bearer' });

    expect(graph.body.length).toBe(1);
    const result = graph.body[0];
    expect(result.id).toBeDefined();
    expect(graph.statusCode).toBe(200);
    expect(result.title).toBe(newGraphModel.title);
    expect(result.robotId).toBe(ros2Mock.robot.id);
    expect(result.partId).toBe(ros2Mock.robot.parts[0].id);
  });

  it.todo('get organization graphs', async () => {
    const newGraphModel = {
      ...flow,
      robotId: ros2Mock.robot.id,
      partId: ros2Mock.robot.parts[0].id,
      title: `test graph ${randomUUID()}`
    };

    const res = await request(app)
      .post('/graph/create')
      .auth(token, { type: 'bearer' })
      .send(newGraphModel);

    const graph = await request(app)
      .get(`/graph/organization/${ros2Mock.organization.id}`)
      .auth(token, { type: 'bearer' });
    expect(graph.body.id).toBeDefined();
    expect(graph.statusCode).toBe(200);
    expect(graph.body.title).toBe(newGraphModel.title);
    expect(graph.body.robotId).toBe(ros2Mock.robot.id);
    expect(graph.body.partId).toBe(ros2Mock.robot.parts[0].id);
  });

  it('update a graph', async () => {
    const newGraphModel = {
      ...flow,
      robotId: ros2Mock.robot.id,
      partId: ros2Mock.robot.parts[0].id,
      title: `test graph ${randomUUID()}`
    };
    const res = await request(app)
      .post('/graph/create')
      .auth(token, { type: 'bearer' })
      .send(newGraphModel);

    const updatedModel = {
      title: `test graph updated ${randomUUID()}`,
      nodes: [{
        width: 97,
        height: 208,
        id: '30ff93a-f757-4ca0-938d-9cfd729f604e',
        type: 'publisherNode',
        position: {
          x: 994,
          y: 190
        },
        preview: false,
        publisherId: '650ed2d0349c25d66ce010f5',
        title: 'test pub',
        selected: false,
        positionAbsolute: {
          x: 994,
          y: 190
        },
        dragging: false
      },
      {
        width: 60,
        height: 60,
        id: '483415fd-2146-4e19-83b4-6aabdd0aa1a7',
        type: 'ifNode',
        position: {
          x: 524,
          y: 304
        },
        preview: false,
        data: {},
        title: 'If',
        selected: false,
        positionAbsolute: {
          x: 524,
          y: 304
        },
        dragging: false
      }]
    };
    const resUpdate = await request(app)
      .post(`/graph/update/${res.body.id}`)
      .auth(token, { type: 'bearer' })
      .send(updatedModel);

    expect(resUpdate.statusCode).toBe(200);
    const update = NeutronGraph.findOne({ _id: res.body.id });

    expect(update.title).toBe(updatedModel.title);
    expect(update.nodes.length).toBe(2);
    expect(update.nodes[0].id).toBe('30ff93a-f757-4ca0-938d-9cfd729f604e');
  });

  it('delete a graph', async () => {
    const graphModel = {
      ...flow,
      robotId: ros2Mock.robot.id,
      partId: ros2Mock.robot.parts[0].id,
      title: `test graph ${randomUUID()}`
    };

    const res = await request(app)
      .post('/graph/create')
      .auth(token, { type: 'bearer' })
      .send(graphModel);

    const deleteRes = await request(app)
      .delete(`/graph/${res.body.id}`)
      .auth(token, { type: 'bearer' });

    expect(deleteRes.statusCode).toBe(200);
    const deletedGraph = NeutronGraph.findOne({ _id: res.body.id });
    expect(deletedGraph).not.toBeDefined();
  });
});
