import axios from 'axios';
import ApplicationError from '../errors/application-error';

const register = async (hostname: string, port: number, registerId: string) => {
  const res = await axios.get(`${hostname}:${port}/register/${registerId}`);
  if (res.status !== 200) { throw new ApplicationError('Connection registration failed'); };
};

export { register };
