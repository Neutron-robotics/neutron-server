/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app';
import { generateRandomString } from './string';
import Robot from '../../src/models/Robot';
import { makeOrganization } from './organization_setup';
import Organization from '../../src/models/Organization';
import RobotPart, { IRobotPart, RobotPartCategory } from '../../src/models/RobotPart';
import { IRobotPartModel, makeRobot } from './robot_setup';
import { ROS2ActionMessageModel, ROS2ServiceMessageModel } from '../../src/models/Ros2/Ros2Messages';
import ROS2TopicModel from '../../src/models/Ros2/Ros2Topic';
import ROS2PublisherModel from '../../src/models/Ros2/Ros2Publisher';
import ROS2SubscriberModel from '../../src/models/Ros2/Ros2Subscriber';
import ROS2ActionModel from '../../src/models/Ros2/Ros2Action';

interface IRos2Mock {
    cleanUp: () => Promise<void>
    getPart: () => Promise<IRobotPart>
    createMessageType: (data: any) => Promise<request.Response>
    createServiceType: (data: any) => Promise<request.Response>
    createActionType: (data: any) => Promise<request.Response>
    createTopic: (name: string, messageTypeId: number) => Promise<request.Response>
    createPublisher: (
        name: string,
        topicId: string,
        frequency: number
      ) => Promise<request.Response>
      createSubscriber: (
        name: string,
        topicId: string,
      ) => Promise<request.Response>
      createService: (
        name: string,
        serviceTypeId: string,
      ) => Promise<request.Response>
      createAction: (
        name: string,
        actionTypeId: string,
      ) => Promise<request.Response>
      getRos2System: (

      ) => Promise<request.Response>
}

const ROS2MESSAGES_XY = {
  message: {
    name: 'test/coordinate',
    fields: [
      {
        fieldtype: 'int32',
        fieldname: 'x'
      },
      {
        fieldtype: 'int32',
        fieldname: 'y'
      }
    ]
  }
};

const ROS2SRV_STATUS = {
  service: {
    name: 'test/getStatus',
    request: [
      {
        fieldtype: 'int32',
        fieldname: 'id'
      }
    ],
    response: [
      {
        fieldtype: 'int32',
        fieldname: 'id'
      },
      {
        fieldtype: 'string',
        fieldname: 'status'
      }
    ]
  }
};

const ROS2ACTION_PROGRESS = {
  action: {
    name: 'test/progress',
    goal: [
      {
        fieldtype: 'string',
        fieldname: 'value2'
      },
      {
        fieldtype: 'int32',
        fieldname: 'value'
      }
    ],
    feedback: [
      {
        fieldtype: 'int32',
        fieldname: 'progress'
      }
    ],
    result: [
      {
        fieldtype: 'string',
        fieldname: 'result'
      }
    ]
  }
};

const emptyIdList: any = {
  msg: [],
  act: [],
  srv: [],
  topic: [],
  publisher: [],
  subscriber: [],
  service: [],
  action: []
};

const cleanUpList = async <T, >(model: mongoose.Model<T>, idList: []) => {
  for (const e of idList) {
    await model.deleteOne({ _id: e });
  }
};

const ros2Mocks = async (token: string, partModel: IRobotPartModel) => {
  const { robot, organization } = await makeRobot(token, [partModel]);
  const part = robot.parts[0];

  let cleanUpIdList: any = emptyIdList;

  const cleanUp = async () => {
    await cleanUpList(ROS2ActionMessageModel, emptyIdList.msg);
    await cleanUpList(ROS2ServiceMessageModel, emptyIdList.srv);
    await cleanUpList(ROS2ActionMessageModel, emptyIdList.act);
    await cleanUpList(ROS2TopicModel, emptyIdList.topic);
    await cleanUpList(ROS2PublisherModel, emptyIdList.publisher);
    await cleanUpList(ROS2SubscriberModel, emptyIdList.subscriber);
    await cleanUpList(ROS2ActionModel, emptyIdList.action);

    await Robot.deleteOne({ _id: robot._id });
    await Organization.deleteOne({ _id: organization?._id });
    cleanUpIdList = emptyIdList;
  };

  const getPart = async () => {
    const robotModel = await Robot.findById(robot.id);
    const partModel = robotModel?.parts.find(e => e._id.toString() === part.id);
    return partModel as IRobotPart;
  };

  const createMessageType = async (data: any) => {
    const res = await request(app)
      .post(`/ros2/${robot.id}/${part.id}/createMessageType`)
      .auth(token, { type: 'bearer' })
      .send(data);
    cleanUpIdList.msg.push(res.body.id);
    return res;
  };

  const createServiceType = async (data: any) => {
    const res = await request(app)
      .post(`/ros2/${robot.id}/${part.id}/createMessageType`)
      .auth(token, { type: 'bearer' })
      .send(data);
    cleanUpIdList.srv.push(res.body.id);
    return res;
  };

  const createActionType = async (data: any) => {
    const res = await request(app)
      .post(`/ros2/${robot.id}/${part.id}/createMessageType`)
      .auth(token, { type: 'bearer' })
      .send(data);
    cleanUpIdList.act.push(res.body.id);
    return res;
  };

  const createTopic = async (name: string, messageTypeId: number) => {
    const res = await request(app)
      .post(`/ros2/${robot.id}/${part.id}/createTopic`)
      .auth(token, { type: 'bearer' })
      .send({
        name,
        messageTypeId
      });
    cleanUpIdList.topic.push(res.body.id);
    return res;
  };

  const createPublisher = async (
    name: string,
    topicId: string,
    frequency: number
  ) => {
    const res = await request(app)
      .post(`/ros2/${robot.id}/${part.id}/createPublisher`)
      .auth(token, { type: 'bearer' })
      .send({
        name,
        topicId,
        frequency
      });
    cleanUpIdList.publisher.push(res.body.id);
    return res;
  };

  const createSubscriber = async (
    name: string,
    topicId: string,
  ) => {
    const res = await request(app)
      .post(`/ros2/${robot.id}/${part.id}/createSubscriber`)
      .auth(token, { type: 'bearer' })
      .send({
        name,
        topicId
      });
    cleanUpIdList.subscriber.push(res.body.id);
    return res;
  };

  const createAction = async (
    name: string,
    actionTypeId: string,
  ) => {
    const res = await request(app)
      .post(`/ros2/${robot.id}/${part.id}/createAction`)
      .auth(token, { type: 'bearer' })
      .send({
        name,
        actionTypeId
      });
    cleanUpIdList.subscriber.push(res.body.id);
    return res;
  };

  const createService = async (
    name: string,
    serviceTypeId: string,
  ) => {
    const res = await request(app)
      .post(`/ros2/${robot.id}/${part.id}/createService`)
      .auth(token, { type: 'bearer' })
      .send({
        name,
        serviceTypeId
      });
    cleanUpIdList.service.push(res.body.id);
    return res;
  };

  const getRos2System = async () => {
    const res = await request(app)
      .get(`/ros2/${robot.id}`)
      .auth(token, { type: 'bearer' });
    return res;
  };

  return {
    cleanUp,
    createMessageType,
    createServiceType,
    createActionType,
    createTopic,
    createPublisher,
    createSubscriber,
    createService,
    createAction,
    getPart,
    getRos2System
  };
};

export {
  ros2Mocks, ROS2MESSAGES_XY, IRos2Mock, ROS2SRV_STATUS, ROS2ACTION_PROGRESS
};
