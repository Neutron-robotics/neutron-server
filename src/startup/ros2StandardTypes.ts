import logger from '../logger';
import {
  ROS2ActionMessageModel, ROS2ActionMessageStructure, ROS2MessageModel, ROS2MessageStructure, ROS2ServiceMessageModel, ROS2ServiceMessageStructure
} from '../models/Ros2/Ros2Messages';

interface Field {
  fieldname: string;
  fieldtype: 'string' | 'boolean' | 'number';
}

interface StandardMessageType {
  name: string;
  fields: Field[];
}

interface StandardServiceType {
  name: string;
  request: Field[];
  response: Field[];
}

interface ActionFeedbackField {
  fieldname: string;
  fieldtype: 'string' | 'boolean' | 'number';
}

interface StandardActionType {
  name: string;
  goal: Field[];
  feedback: Field[];
  result: ActionFeedbackField[];
}

const standardMessageTypes: StandardMessageType[] = [
  { name: 'std_msgs/msg/String', fields: [{ fieldname: 'data', fieldtype: 'string' }] },
  { name: 'std_msgs/msg/Byte', fields: [{ fieldname: 'data', fieldtype: 'string' }] },
  { name: 'std_msgs/msg/Char', fields: [{ fieldname: 'data', fieldtype: 'string' }] },
  { name: 'std_msgs/msg/Bool', fields: [{ fieldname: 'data', fieldtype: 'boolean' }] },
  { name: 'std_msgs/msg/Int8', fields: [{ fieldname: 'data', fieldtype: 'number' }] },
  { name: 'std_msgs/msg/UInt8', fields: [{ fieldname: 'data', fieldtype: 'number' }] },
  { name: 'std_msgs/msg/Int16', fields: [{ fieldname: 'data', fieldtype: 'number' }] },
  { name: 'std_msgs/msg/UInt16', fields: [{ fieldname: 'data', fieldtype: 'number' }] },
  { name: 'std_msgs/msg/Int32', fields: [{ fieldname: 'data', fieldtype: 'number' }] },
  { name: 'std_msgs/msg/UInt32', fields: [{ fieldname: 'data', fieldtype: 'number' }] },
  { name: 'std_msgs/msg/Int64', fields: [{ fieldname: 'data', fieldtype: 'number' }] },
  { name: 'std_msgs/msg/UInt64', fields: [{ fieldname: 'data', fieldtype: 'number' }] },
  { name: 'std_msgs/msg/Float32', fields: [{ fieldname: 'data', fieldtype: 'number' }] },
  { name: 'std_msgs/msg/Float64', fields: [{ fieldname: 'data', fieldtype: 'number' }] },
  { name: 'std_msgs/msg/Time', fields: [{ fieldname: 'data', fieldtype: 'number' }] },
  { name: 'std_msgs/msg/Duration', fields: [{ fieldname: 'data', fieldtype: 'number' }] },
  { name: 'std_msgs/msg/Empty', fields: [] }
];

const standardServiceTypes: StandardServiceType[] = [
  {
    name: 'std_srvs/srv/Empty',
    request: [],
    response: []
  },
  {
    name: 'std_srvs/srv/SetBool',
    request: [{ fieldname: 'data', fieldtype: 'boolean' }],
    response: [{ fieldname: 'success', fieldtype: 'boolean' }]
  },
  {
    name: 'std_srvs/srv/Trigger',
    request: [],
    response: [{ fieldname: 'success', fieldtype: 'boolean' }]
  }
];

const standardActionTypes: StandardActionType[] = [
  {
    name: 'std_msgs/action/Empty',
    goal: [],
    result: [],
    feedback: []
  },
  {
    name: 'std_msgs/action/SetBool',
    goal: [{ fieldname: 'data', fieldtype: 'boolean' }],
    result: [{ fieldname: 'success', fieldtype: 'boolean' }],
    feedback: []
  }
];

const verifyStandardMessageOrInstall = async (installedMessages: ROS2MessageStructure[], stdMessage: StandardMessageType) => {
  if (installedMessages.find(e => e.name === stdMessage.name)) return;
  logger.info(`[ros2StandardType] Installing ${stdMessage.name}`);
  await ROS2MessageModel.create({
    ...stdMessage,
    isStandard: true
  });
};

const verifyStandardServiceOrInstall = async (installedMessages: ROS2ServiceMessageStructure[], stdMessage: StandardServiceType) => {
  if (installedMessages.find(e => e.name === stdMessage.name)) return;
  logger.info(`[ros2StandardType] Installing ${stdMessage.name}`);
  await ROS2ServiceMessageModel.create({
    ...stdMessage,
    isStandard: true
  });
};

const verifyStandardActionOrInstall = async (installedMessages: ROS2ActionMessageStructure[], stdMessage: StandardActionType) => {
  if (installedMessages.find(e => e.name === stdMessage.name)) return;
  logger.info(`[ros2StandardType] Installing ${stdMessage.name}`);
  await ROS2ActionMessageModel.create({
    ...stdMessage,
    isStandard: true
  });
};

const ros2StandardTypes = async () => {
  const installedStandardMessageTypes = await ROS2MessageModel.find({ isStandard: true }).lean().exec();
  const installedStandardServiceTypes = await ROS2ServiceMessageModel.find({ isStandard: true }).lean().exec();
  const installedStandardActionTypes = await ROS2ActionMessageModel.find({ isStandard: true }).lean().exec();

  const stdMessagesInstallationPromises = standardMessageTypes.map(e => verifyStandardMessageOrInstall(installedStandardMessageTypes, e));
  const stdServicesInstallationPromises = standardServiceTypes.map(e => verifyStandardServiceOrInstall(installedStandardServiceTypes, e));
  const stdActionsInstallationPromises = standardActionTypes.map(e => verifyStandardActionOrInstall(installedStandardActionTypes, e));
  await Promise.all(stdMessagesInstallationPromises);
  await Promise.all(stdServicesInstallationPromises);
  await Promise.all(stdActionsInstallationPromises);
};

export default ros2StandardTypes;
