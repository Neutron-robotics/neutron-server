/* eslint-disable no-param-reassign */
import axios from 'axios';
import Connection from '../models/Connection';
import Robot from '../models/Robot';
import logger from '../logger';

const closeOpenConnections = async () => {
  const openConnections = await Connection.find({
    isActive: true
  });

  const closeConnectionPromise = openConnections.map(connection => {
    connection.isActive = false;
    connection.closedAt = new Date();
    return connection.save();
  });

  try {
    await Promise.all(closeConnectionPromise);
  } catch (err: any) {
    logger.error('An error happens while closing connection', err.message);
  }

  const closedConnectionRobotIds = openConnections.map(e => e.robotId);
  const robots = await Robot.find({ _id: { $in: closedConnectionRobotIds } });
  const stopRobotPromises = robots.map(robot => axios.post(`http://${robot.hostname}:8000/robot/stop`));

  try {
    await Promise.all(stopRobotPromises);
  } catch (err: any) {
    logger.error('An error happens while stopping robot', err.message);
  }
};

export default closeOpenConnections;
