import request from 'supertest';
import app from '../../src/app';
import { generateRandomString } from './string';
import Robot, { IRobotPart } from '../../src/models/Robot';
import { makeOrganization } from './organization_setup';
import Organization from '../../src/models/Organization';

const makeRobot = async (token: string, parts: IRobotPart[], organizationName?: string) => {
  const organization = organizationName ? await Organization.findOne({ name: organizationName }).exec() : await makeOrganization(token);

  const robotName = `test robot ${generateRandomString(6)}`;
  await request(app)
    .post('/robot/create')
    .auth(token, { type: 'bearer' })
    .send({
      name: robotName,
      parts,
      imgUrl: 'https://static.hugosoft.com/robots/test.png',
      description: 'This is a test robot',
      connectionContextType: 'ros2',
      organizationId: organization?.id
    });

  const robot = await Robot.findOne({ name: robotName }).exec();
  if (!robot) { throw new Error('The test robot failed to be created'); };

  return {
    robot,
    organization
  };
};

export { makeRobot };
