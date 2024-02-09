/* eslint-disable no-param-reassign */
import Connection from '../models/Connection';

const closeOpenConnections = async () => {
  const openConnections = await Connection.find({
    isActive: true
  });

  const closePromise = openConnections.map(connection => {
    connection.isActive = false;
    connection.closedAt = new Date();
    return connection.save();
  });

  await Promise.all(closePromise);
};

export default closeOpenConnections;
