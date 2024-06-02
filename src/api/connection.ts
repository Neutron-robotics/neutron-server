import axios from 'axios';
import ApplicationError from '../errors/application-error';

// neutron-connection
const register = async (hostname: string, port: number, registerId: string) => {
  const res = await axios.post(`http://${hostname}:${port}/register/${registerId}`);
  if (res.status !== 200) { throw new ApplicationError('Connection registration failed'); };
};

// neutron-agent
const stopRobot = async (hostname: string, port: number) => {
  const res = await axios.post(`http://${hostname}:${port}/robot/stop`, {});
  if (res.status !== 200) { throw new ApplicationError('Failed to stop the robot'); };
};

export { register, stopRobot };
