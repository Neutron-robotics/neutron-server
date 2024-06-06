import request from 'supertest';
import app from '../../src/app';
import Robot from '../../src/models/Robot';
import { makeOrganization } from './organization_setup';
import Organization from '../../src/models/Organization';
import { RobotPartCategory } from '../../src/models/RobotPart';
import { RobotStatus } from '../../src/models/RobotStatus';
import { generateRandomString } from '../../src/utils/random';

export interface IRobotPartModel {
  type: string
    category: RobotPartCategory
    name: string
    imgUrl: string
}

const makeRobot = async (token: string, parts: IRobotPartModel[], organizationName?: string, robotStatus?: RobotStatus) => {
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
  if (robotStatus) {
    await request(app)
      .post('/agent/link')
      .send({
        secretKey: robot.secretKey
      });
    await request(app)
      .post('/agent/publishSystemInformation')
      .send({
        secretKey: robot.secretKey,
        status: {
          status: robotStatus,
          context: {
            cpu: 5,
            mem: 2,
            mem_usage: 2000,
            active: true,
            pid: 9583,
            name: 'my context',
            id: 'tototototo',
            port: 9510
          },
          system: {
            cpu: 34,
            memory: 10
          },
          processes: [],
          network: {
            hostname: 'localhost'
          },
          hash: robot.generateHash()
        }
      });
  }

  return {
    robot,
    organization
  };
};

export { makeRobot };
