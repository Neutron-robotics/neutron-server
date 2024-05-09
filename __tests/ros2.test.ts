import dotenv from 'dotenv';
import mongoose from 'mongoose';
import request from 'supertest';
import { makeUser, withLogin } from './__utils__/user_setup';
import User from '../src/models/User';
import { RobotPartCategory } from '../src/models/RobotPart';
import { makeRobot } from './__utils__/robot_setup';
import app from '../src/app';
import { ROS2ActionMessageModel, ROS2MessageModel, ROS2ServiceMessageModel } from '../src/models/Ros2/Ros2Messages';
import {
  IRos2Mock, ROS2ACTION_PROGRESS, ROS2MESSAGES_WZ, ROS2MESSAGES_XY, ROS2SRV_STATUS, ros2Mocks
} from './__utils__/ros2_setup';
import ROS2TopicModel from '../src/models/Ros2/Ros2Topic';
import ROS2PublisherModel from '../src/models/Ros2/Ros2Publisher';
import ROS2SubscriberModel from '../src/models/Ros2/Ros2Subscriber';
import ROS2ActionModel from '../src/models/Ros2/Ros2Action';
import ROS2ServiceModel from '../src/models/Ros2/Ros2Service';

jest.mock('../src/utils/nodemailer/sendEmail', () => jest.fn());

jest.mock('../src/api/elasticsearch/dataview', () => ({
  deleteDataViewByIndexPattern: jest.fn(),
  createDataView: jest.fn().mockReturnValue(Promise.resolve('toto'))
}));

jest.mock('../src/api/elasticsearch/connectionDashboard', () => ({
  deleteDashboard: jest.fn(),
  createConnectionDashboard: jest.fn()
}));

jest.mock('../src/api/elasticsearch/roles', () => ({
  createOrganizationRole: jest.fn(),
  addRolesToUser: jest.fn(),
  removeRolesFromUser: jest.fn()
}));

describe('ros2 protocol related tests', () => {
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
      type: 'RGBCamera',
      category: RobotPartCategory.Vison,
      name: 'test camera',
      imgUrl: 'https://static.neutron.com/robot/w.png'
    });
  });

  afterEach(async () => {
    await User.deleteOne({ email: user.email });
    await ros2Mock.cleanUp();
    await mongoose.connection.close();
  });

  it('Create messages', async () => {
    const messageType = await ros2Mock.createMessageType(ROS2MESSAGES_XY);
    const actionType = await ros2Mock.createActionType(ROS2ACTION_PROGRESS);
    const srvType = await ros2Mock.createServiceType(ROS2SRV_STATUS);

    expect(messageType.statusCode).toBe(200);
    expect(messageType.body.id).toBeDefined();
    expect(actionType.statusCode).toBe(200);
    expect(actionType.body.id).toBeDefined();
    expect(srvType.statusCode).toBe(200);
    expect(srvType.body.id).toBeDefined();
    const message = await ROS2MessageModel.findOne({ _id: messageType.body.id });
    expect(message).toBeDefined();
    expect(message?.name).toBe('test/coordinate');
    expect(message?.fields.length).toBe(2);
    expect(message?.fields[0].fieldtype).toBe('int32');

    const service = await ROS2ServiceMessageModel.findOne({ _id: srvType.body.id });
    expect(service).toBeDefined();
    expect(service?.name).toBe('test/getStatus');
    expect(service?.request.length).toBe(1);
    expect(service?.response.length).toBe(2);
    expect(service?.request[0].fieldtype).toBe('int32');
    expect(service?.response[0].fieldtype).toBe('int32');

    const action = await ROS2ActionMessageModel.findOne({ _id: actionType.body.id });
    expect(action).toBeDefined();
    expect(action?.name).toBe('test/progress');
    expect(action?.goal.length).toBe(2);
    expect(action?.feedback.length).toBe(1);
    expect(action?.result.length).toBe(1);
    expect(action?.goal[0].fieldtype).toBe('string');
    expect(action?.feedback[0].fieldtype).toBe('int32');
    expect(action?.result[0].fieldname).toBe('result');
  });

  it('Create a Topic', async () => {
    const messageTypeId = (await ros2Mock.createMessageType(ROS2MESSAGES_XY)).body.id;
    const res = await ros2Mock.createTopic('testopic', messageTypeId);

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBeDefined();

    const topic = await ROS2TopicModel.findOne({ _id: res.body.id });
    expect(topic?.name).toBe('testopic');
    expect(topic?.messageType._id.toString()).toBe(messageTypeId);
  });

  it('Create a Publisher', async () => {
    const messageTypeId = (await ros2Mock.createMessageType(ROS2MESSAGES_XY)).body.id;
    const topicId = (await ros2Mock.createTopic('testopic', messageTypeId)).body.id;

    const res = await ros2Mock.createPublisher('testpublisher', topicId, 5);

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBeDefined();

    const publisher = await ROS2PublisherModel.findOne({ _id: res.body.id });
    expect(publisher?.name).toBe('testpublisher');
    expect(publisher?.topic._id.toString()).toBe(topicId);
    expect(publisher?.frequency).toBe(5);

    const part = await ros2Mock.getPart();
    expect(part.publishers.includes(publisher?.id));
  });

  it('Create a Subscriber', async () => {
    const messageTypeId = (await ros2Mock.createMessageType(ROS2MESSAGES_XY)).body.id;
    const topicId = (await ros2Mock.createTopic('testopic', messageTypeId)).body.id;

    const res = await ros2Mock.createSubscriber('testsubscriber', topicId);

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBeDefined();
    const subscriber = await ROS2SubscriberModel.findOne({ _id: res.body.id });
    expect(subscriber?.name).toBe('testsubscriber');
    expect(subscriber?.topic._id.toString()).toBe(topicId);

    const part = await ros2Mock.getPart();
    expect(part.subscribers.includes(subscriber?.id));
  });

  it('Create an Action', async () => {
    const actionTypeId = (await ros2Mock.createActionType(ROS2ACTION_PROGRESS)).body.id;
    const res = await ros2Mock.createAction('testaction', actionTypeId);

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBeDefined();

    const action = await ROS2ActionModel.findOne({ _id: res.body.id });
    expect(action?.name).toBe('testaction');
    expect(action?.actionType._id?.toString()).toBe(actionTypeId);

    const part = await ros2Mock.getPart();
    expect(part.actions.includes(action?.id));
  });

  it('Create a Service', async () => {
    const serviceTypeId = (await ros2Mock.createServiceType(ROS2SRV_STATUS)).body.id;
    const res = await ros2Mock.createService('testService', serviceTypeId);

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBeDefined();

    const service = await ROS2ServiceModel.findOne({ _id: res.body.id });
    expect(service?.name).toBe('testService');
    expect(service?.serviceType._id?.toString()).toBe(serviceTypeId);
    const part = await ros2Mock.getPart();
    expect(part.services.includes(service?.id));
  });

  it('Delete a Topic', async () => {
    const { robot } = await makeRobot(token, [{
      type: 'RGBCamera',
      category: RobotPartCategory.Vison,
      name: 'test camera',
      imgUrl: 'https://static.neutron.com/robot/w.png'
    }]);
    const part = robot.parts[0];
    const messageTypeId = (await ros2Mock.createMessageType(ROS2MESSAGES_XY)).body.id;
    const topicId = (await ros2Mock.createTopic('testopic', messageTypeId)).body.id;

    const res = await request(app)
      .delete(`/ros2/${robot.id}/${part.id}/deleteTopic/${topicId}`)
      .auth(token, { type: 'bearer' });

    expect(res.statusCode).toBe(200);
    const topic = await ROS2TopicModel.findOne({ _id: topicId });
    expect(topic).toBeNull();
  });

  it('Delete a Publisher', async () => {
    const { robot } = await makeRobot(token, [{
      type: 'RGBCamera',
      category: RobotPartCategory.Vison,
      name: 'test camera',
      imgUrl: 'https://static.neutron.com/robot/w.png'
    }]);
    const part = robot.parts[0];
    const messageTypeId = (await ros2Mock.createMessageType(ROS2MESSAGES_XY)).body.id;
    const topicId = (await ros2Mock.createTopic('testopic', messageTypeId)).body.id;
    const publisherId = (await ros2Mock.createPublisher('testpublisher', topicId, 5)).body.id;

    const res = await request(app)
      .delete(`/ros2/${robot.id}/${part.id}/deletePublisher/${publisherId}`)
      .auth(token, { type: 'bearer' });

    expect(res.statusCode).toBe(200);
    const publisher = await ROS2PublisherModel.findOne({ _id: publisherId });
    expect(publisher).toBeNull();
  });

  it('Delete a Subscriber', async () => {
    const { robot } = await makeRobot(token, [{
      type: 'RGBCamera',
      category: RobotPartCategory.Vison,
      name: 'test camera',
      imgUrl: 'https://static.neutron.com/robot/w.png'
    }]);
    const part = robot.parts[0];
    const messageTypeId = (await ros2Mock.createMessageType(ROS2MESSAGES_XY)).body.id;
    const topicId = (await ros2Mock.createTopic('testopic', messageTypeId)).body.id;
    const subscriberId = (await ros2Mock.createSubscriber('testsubscriper', topicId)).body.id;

    const res = await request(app)
      .delete(`/ros2/${robot.id}/${part.id}/deleteSubscriber/${subscriberId}`)
      .auth(token, { type: 'bearer' });

    expect(res.statusCode).toBe(200);
    const subscriber = await ROS2SubscriberModel.findOne({ _id: subscriberId });
    expect(subscriber).toBeNull();
  });

  it('Delete an Action', async () => {
    const { robot } = await makeRobot(token, [{
      type: 'RGBCamera',
      category: RobotPartCategory.Vison,
      name: 'test camera',
      imgUrl: 'https://static.neutron.com/robot/w.png'
    }]);
    const part = robot.parts[0];
    const actionTypeId = (await ros2Mock.createActionType(ROS2ACTION_PROGRESS)).body.id;
    const actionId = (await ros2Mock.createAction('testaction', actionTypeId)).body.id;

    const res = await request(app)
      .delete(`/ros2/${robot.id}/${part.id}/deleteAction/${actionId}`)
      .auth(token, { type: 'bearer' });

    expect(res.statusCode).toBe(200);
    const action = await ROS2ActionModel.findOne({ _id: actionId });
    expect(action).toBeNull();
  });

  it('Delete a Service', async () => {
    const { robot } = await makeRobot(token, [{
      type: 'RGBCamera',
      category: RobotPartCategory.Vison,
      name: 'test camera',
      imgUrl: 'https://static.neutron.com/robot/w.png'
    }]);
    const part = robot.parts[0];
    const serviceTypeId = (await ros2Mock.createServiceType(ROS2SRV_STATUS)).body.id;
    const serviceId = (await ros2Mock.createService('testservice', serviceTypeId)).body.id;

    const res = await request(app)
      .delete(`/ros2/${robot.id}/${part.id}/deleteService/${serviceId}`)
      .auth(token, { type: 'bearer' });

    expect(res.statusCode).toBe(200);
    const service = await ROS2ServiceModel.findOne({ _id: serviceId });
    expect(service).toBeNull();
  });

  it('Deleting a Pub/sub should destroy topic and messages if no other', async () => {
    const { robot } = await makeRobot(token, [{
      type: 'RGBCamera',
      category: RobotPartCategory.Vison,
      name: 'test camera',
      imgUrl: 'https://static.neutron.com/robot/w.png'
    }]);
    const part = robot.parts[0];

    const messageTypeId = (await ros2Mock.createMessageType(ROS2MESSAGES_XY)).body.id;
    const topicId = (await ros2Mock.createTopic('testopic', messageTypeId)).body.id;
    const actionTypeId = (await ros2Mock.createActionType(ROS2ACTION_PROGRESS)).body.id;
    const actionId = (await ros2Mock.createAction('testaction', actionTypeId)).body.id;
    const serviceTypeId = (await ros2Mock.createServiceType(ROS2SRV_STATUS)).body.id;
    const serviceId = (await ros2Mock.createService('testservice', serviceTypeId)).body.id;
    const subscriberId = (await ros2Mock.createSubscriber('testsubscriper', topicId)).body.id;
    const publisherId = (await ros2Mock.createPublisher('testpublisher', topicId, 5)).body.id;

    await request(app)
      .delete(`/ros2/${robot.id}/${part.id}/deletePublisher/${publisherId}`)
      .auth(token, { type: 'bearer' });
    await request(app)
      .delete(`/ros2/${robot.id}/${part.id}/deleteSubscriber/${subscriberId}`)
      .auth(token, { type: 'bearer' });
    await request(app)
      .delete(`/ros2/${robot.id}/${part.id}/deleteService/${serviceId}`)
      .auth(token, { type: 'bearer' });
    await request(app)
      .delete(`/ros2/${robot.id}/${part.id}/deleteAction/${actionId}`)
      .auth(token, { type: 'bearer' });

    const messageType = await ROS2ServiceModel.findOne({ _id: messageTypeId });
    expect(messageType).toBeNull();
    const topic = await ROS2ServiceModel.findOne({ _id: topicId });
    expect(topic).toBeNull();
    const actionType = await ROS2ServiceModel.findOne({ _id: actionTypeId });
    expect(actionType).toBeNull();
    const serviceType = await ROS2ServiceModel.findOne({ _id: serviceTypeId });
    expect(serviceType).toBeNull();
  });

  it('creating ros2 environement on robot and fetch it via http', async () => {
    const messageTypeId = (await ros2Mock.createMessageType(ROS2MESSAGES_XY)).body.id;
    const topicId = (await ros2Mock.createTopic('testopic', messageTypeId)).body.id;
    const actionTypeId = (await ros2Mock.createActionType(ROS2ACTION_PROGRESS)).body.id;
    const serviceTypeId = (await ros2Mock.createServiceType(ROS2SRV_STATUS)).body.id;

    await ros2Mock.createAction('testaction', actionTypeId);
    await ros2Mock.createService('testservice', serviceTypeId);
    await ros2Mock.createSubscriber('testsubscriper', topicId);
    await ros2Mock.createPublisher('testpublisher', topicId, 5);

    const ros2System = await ros2Mock.getRos2System();

    expect(ros2System.statusCode).toBe(200);
    expect(ros2System.body.model.subscribers.length).toBe(1);
    expect(ros2System.body.model.subscribers[0].name).toBe('testsubscriper');
    expect(ros2System.body.model.services.length).toBe(1);
    expect(ros2System.body.model.actions.length).toBe(1);
    expect(ros2System.body.model.publishers.length).toBe(1);
    expect(ros2System.body.model.topics.length).toBe(1);
  });

  it('Update ros2 schema for a topic', async () => {
    const messageTypeId = (await ros2Mock.createMessageType(ROS2MESSAGES_XY)).body.id;
    const topicId = (await ros2Mock.createTopic('testopic', messageTypeId)).body.id;

    const update = await ros2Mock.updateRos2('topic', {
      topic: {
        _id: topicId,
        name: 'nouveautopic'
      }
    });

    const topic = await ROS2TopicModel.findById(topicId);
    const topicPopulated: any = await ROS2TopicModel.populate(topic, [{ path: 'messageType' }]);

    expect(update.statusCode).toBe(200);
    expect(topic).toBeDefined();
    expect(topic?.name).toBe('nouveautopic');
    expect(topicPopulated.messageType.fields.length).toBe(2);
  });

  it('Update ros2 schema for a topic then pub sub', async () => {
    const messageTypeId = (await ros2Mock.createMessageType(ROS2MESSAGES_XY)).body.id;
    const messageTypeId2 = (await ros2Mock.createMessageType(ROS2MESSAGES_WZ)).body.id;
    const topicId = (await ros2Mock.createTopic('testopic', messageTypeId)).body.id;
    const subscriberId = (await ros2Mock.createSubscriber('testsubscriper', topicId)).body.id;

    const update = await ros2Mock.updateRos2('topic', {
      topic: {
        _id: topicId,
        messageType: {
          _id: messageTypeId2
        }
      }
    });

    expect(update.statusCode).toBe(200);
    const topic = await ROS2TopicModel.findById(topicId);
    const topicPopulated: any = await ROS2TopicModel.populate(topic, [{ path: 'messageType' }]);
    expect(topicPopulated.messageType.fields.length).toBe(2);
    expect(topicPopulated.messageType.fields[0].fieldname).toBe('w');

    const subscriber = await ROS2SubscriberModel.findById(subscriberId);
    const subscriberPopulated: any = await ROS2SubscriberModel.populate(subscriber, [{ path: 'topic' }]);
    expect(subscriberPopulated.topic.messageType._id.toString()).toBe(messageTypeId2);
  });
});
