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
import NeutronGraph from '../src/models/NeutronGraph';
import Organization, { IOrganization } from '../src/models/Organization';
import Robot, { IRobot } from '../src/models/Robot';

describe('Neutron graph controller', () => {
  let user: any = {};
  let token: string = '';
  let robotMock: IRobot;
  let organizationMock: IOrganization;
  const result = dotenv.config();
  if (result.error) {
    dotenv.config({ path: '.env.default' });
  }

  beforeEach(async () => {
    await mongoose.connect(process.env.MONGO_URL ?? '');
    const { user: usr, password } = await makeUser(true);
    token = await withLogin(usr.email, password);
    user = usr;
    const { robot, organization } = await makeRobot(token, [{
      type: 'Grapper',
      category: RobotPartCategory.Actuator,
      name: 'Robot grab grab',
      imgUrl: 'https://static.neutron.com/robot/wdjxsiushf.png'
    }]);
    robotMock = robot;
    organizationMock = organization as IOrganization;
  });

  afterEach(async () => {
    User.deleteOne({ email: user.email });
    Robot.deleteOne({ _id: robotMock._id });
    Organization.deleteOne({ _id: organizationMock._id });
    await mongoose.connection.close();
  });

  it('create a new graph', async () => {
    const newGraphModel = {
      ...flow,
      robotId: robotMock.id,
      partId: robotMock.parts[0].id,
      title: `test graph ${randomUUID()}`
    };

    const res = await request(app)
      .post('/graph/create')
      .auth(token, { type: 'bearer' })
      .send(newGraphModel);

    const graph = await NeutronGraph.findOne({ _id: res.body.id });
    if (!graph) { throw new Error('Graph not found'); };
    expect(res.body.id).toBeDefined();
    expect(res.statusCode).toBe(200);
    expect(graph.title).toBe(newGraphModel.title);
    expect(graph.robot.toString()).toBe(robotMock.id);
    expect(graph.part?.toString()).toBe(robotMock.parts[0].id);
    expect(graph.nodes.length).toBe(6);
    expect(graph.edges.length).toBe(6);
    expect(graph.createdAt).toBeDefined();
    const timeDifference = Math.abs(graph.createdAt.getTime() - graph.updatedAt.getTime());
    expect(timeDifference).toBeLessThan(500);
    expect(graph.imgUrl).not.toBeDefined();
  });

  it('create a new graph without part but with a thumbnail', async () => {
    const newGraphModel = {
      ...flow,
      robotId: robotMock.id,
      partId: undefined,
      title: `test graph ${randomUUID()}`,
      imgUrl: 'http://localhost:3003/file/file-1697885700601-962939962.png'
    };

    const res = await request(app)
      .post('/graph/create')
      .auth(token, { type: 'bearer' })
      .send(newGraphModel);

    const graph = await NeutronGraph.findOne({ _id: res.body.id });
    if (!graph) { throw new Error('Graph not found'); };
    expect(res.body.id).toBeDefined();
    expect(res.statusCode).toBe(200);
    expect(graph.title).toBe(newGraphModel.title);
    expect(graph.robot.toString()).toBe(robotMock.id);
    expect(graph.imgUrl).toBe('http://localhost:3003/file/file-1697885700601-962939962.png');
    expect(graph.part).not.toBeDefined();
    expect(graph.nodes.length).toBe(6);
    expect(graph.edges.length).toBe(6);
    expect(graph.createdAt).toBeDefined();
    const timeDifference = Math.abs(graph.createdAt.getTime() - graph.updatedAt.getTime());
    expect(timeDifference).toBeLessThan(500);
  });

  it('get user\'s graphs', async () => {
    const newGraphModel = {
      ...flow,
      robotId: robotMock.id,
      partId: robotMock.parts[0].id,
      title: `test graph ${randomUUID()}`
    };

    const res = await request(app)
      .post('/graph/create')
      .auth(token, { type: 'bearer' })
      .send(newGraphModel);
    expect(res.statusCode).toBe(200);

    const resMyGraphs = await request(app)
      .get('/graph/me')
      .auth(token, { type: 'bearer' });

    const result = resMyGraphs.body.graphs[0];
    expect(resMyGraphs.statusCode).toBe(200);
    expect(resMyGraphs.body.graphs.length).toBe(1);
    expect(result._id).toBeDefined();
    expect(result.title).toBe(newGraphModel.title);
    expect(result.robot).toBe(robotMock.id);
    expect(result.part).toBe(robotMock.parts[0].id);
    expect(result.nodes.length).toBe(6);
    expect(result.edges.length).toBe(6);
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
  });

  it('get organization graphs', async () => {
    const newGraphModel = {
      ...flow,
      robotId: robotMock.id,
      partId: robotMock.parts[0].id,
      title: `test graph ${randomUUID()}`
    };

    const res = await request(app)
      .post('/graph/create')
      .auth(token, { type: 'bearer' })
      .send(newGraphModel);
    expect(res.statusCode).toBe(200);

    const resOrganizationGraphs = await request(app)
      .get(`/graph/organization/${organizationMock.id}`)
      .auth(token, { type: 'bearer' });

    const result = resOrganizationGraphs.body.graphs[0];
    expect(resOrganizationGraphs.statusCode).toBe(200);
    expect(resOrganizationGraphs.body.graphs.length).toBe(1);
    expect(result._id).toBeDefined();
    expect(result.title).toBe(newGraphModel.title);
    expect(result.robot).toBe(robotMock.id);
    expect(result.part).toBe(robotMock.parts[0].id);
    expect(result.nodes.length).toBe(6);
    expect(result.edges.length).toBe(6);
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
  });

  it('get all graphs accessible to user', async () => {
    const newGraphModel = {
      ...flow,
      robotId: robotMock.id,
      partId: robotMock.parts[0].id,
      title: `test graph ${randomUUID()}`
    };

    const res = await request(app)
      .post('/graph/create')
      .auth(token, { type: 'bearer' })
      .send(newGraphModel);
    expect(res.statusCode).toBe(200);

    const resOrganizationGraphs = await request(app)
      .get('/graph/all')
      .auth(token, { type: 'bearer' });

    const result = resOrganizationGraphs.body.graphs[0];
    expect(resOrganizationGraphs.statusCode).toBe(200);
    expect(resOrganizationGraphs.body.graphs.length).toBe(1);
    expect(result._id).toBeDefined();
    expect(result.title).toBe(newGraphModel.title);
    expect(result.robot).toBe(robotMock.id);
    expect(result.part).toBe(robotMock.parts[0].id);
    expect(result.nodes.length).toBe(6);
    expect(result.edges.length).toBe(6);
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
  });

  it('get all graphs accessible to user with robot & organization infos', async () => {
    const newGraphModel = {
      ...flow,
      robotId: robotMock.id,
      partId: robotMock.parts[0].id,
      title: `test graph ${randomUUID()}`
    };

    const res = await request(app)
      .post('/graph/create')
      .auth(token, { type: 'bearer' })
      .send(newGraphModel);
    expect(res.statusCode).toBe(200);

    const resIncludeRobots = await request(app)
      .get('/graph/all?includeRobot=true')
      .auth(token, { type: 'bearer' });
    expect(resIncludeRobots.statusCode).toBe(200);
    expect(resIncludeRobots.body.graphs.length).toBe(1);
    const bdyRobot = resIncludeRobots.body.graphs[0];
    expect(bdyRobot.robot._id).toBe(robotMock.id);
    expect(bdyRobot.robot.name).toBe(robotMock.name);
    expect(bdyRobot.robot.imgUrl).toBe(robotMock.imgUrl);
    expect(bdyRobot.organization).not.toBeDefined();
    expect(Object.entries(bdyRobot.robot).length).toBe(3);

    const resIncludeOrganization = await request(app)
      .get('/graph/all?includeOrganization=true')
      .auth(token, { type: 'bearer' });
    expect(resIncludeOrganization.statusCode).toBe(200);
    expect(resIncludeOrganization.body.graphs.length).toBe(1);
    const bdyOrganization = resIncludeOrganization.body.graphs[0];
    expect(bdyOrganization.robot).toBe(robotMock.id);
    expect(bdyOrganization.organization.id).toBe(organizationMock.id);
    expect(bdyOrganization.organization.name).toBe(organizationMock.name);
    expect(bdyOrganization.organization.imgUrl).toBe(organizationMock.imgUrl);
    expect(Object.entries(bdyOrganization.organization).length).toBe(3);

    const resIncludeBoth = await request(app)
      .get('/graph/all?includeRobot=true&includeOrganization=true')
      .auth(token, { type: 'bearer' });

    const bdyBoth = resIncludeBoth.body.graphs[0];
    expect(resIncludeBoth.statusCode).toBe(200);
    expect(resIncludeBoth.body.graphs.length).toBe(1);
    expect(bdyBoth._id).toBeDefined();
    expect(bdyBoth.title).toBe(newGraphModel.title);
    expect(bdyBoth.nodes.length).toBe(6);
    expect(bdyBoth.edges.length).toBe(6);
    expect(bdyBoth.createdAt).toBeDefined();
    expect(bdyBoth.updatedAt).toBeDefined();

    expect(bdyOrganization.organization.id).toBe(organizationMock.id);
    expect(bdyOrganization.organization.name).toBe(organizationMock.name);
    expect(bdyOrganization.organization.imgUrl).toBe(organizationMock.imgUrl);
    expect(Object.entries(bdyOrganization.organization).length).toBe(3);

    expect(bdyRobot.robot._id).toBe(robotMock.id);
    expect(bdyRobot.robot.name).toBe(robotMock.name);
    expect(bdyRobot.robot.imgUrl).toBe(robotMock.imgUrl);
    expect(Object.entries(bdyRobot.robot).length).toBe(3);
  });

  it('update a graph', async () => {
    const newGraphModel = {
      ...flow,
      robotId: robotMock.id,
      partId: robotMock.parts[0].id,
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
    const update = await NeutronGraph.findOne({ _id: res.body.id });
    if (!update) { throw new Error('Graph not found'); };

    expect(update.title).toBe(updatedModel.title);
    expect(update.nodes.length).toBe(2);
    expect(update.edges.length).toBe(6);
    expect(update.nodes[0].id).toBe('30ff93a-f757-4ca0-938d-9cfd729f604e');
    expect(update.createdAt).toBeDefined();
    expect(update.updatedAt).toBeDefined();
    expect(update.updatedAt.getTime()).toBeGreaterThan(update.createdAt.getTime());
  });

  it('delete a graph', async () => {
    const graphModel = {
      ...flow,
      robotId: robotMock.id,
      partId: robotMock.parts[0].id,
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
    const deletedGraph = await NeutronGraph.findOne({ _id: res.body.id });
    expect(deletedGraph).toBeNull();
  });
});
