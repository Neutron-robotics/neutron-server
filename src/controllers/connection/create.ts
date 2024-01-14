import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import path from 'path';
import mongoose from 'mongoose';
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { withAuth } from '../../middleware/withAuth';
import requestMiddleware from '../../middleware/request-middleware';
import { UserRole } from '../../models/User';
import ApplicationError from '../../errors/application-error';
import Robot from '../../models/Robot';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import { BadRequest, Unauthorized } from '../../errors/bad-request';
import { randomIntFromInterval } from '../../utils/random';
import Connection from '../../models/Connection';
import * as connectionApi from '../../api/connection';
import { RobotStatus } from '../../models/RobotStatus';

export const createSchema = Joi.object().keys({
  robotId: Joi.string().required()
});

interface CreateConnectionBody {
    robotId: string
}

const create: RequestHandler = async (req: Request<{}, {}, CreateConnectionBody>, res, next) => {
  const { body } = req;
  const userId = (req as any).user.sub as string;

  try {
    const fileStorage = process.env.NEUTRON_BIN_PATH;
    const hostname = process.env.HOSTNAME;
    if (!fileStorage || !hostname) { throw new ApplicationError('NEUTRON_BIN_PATH or HOSTNAME not defined'); };
    const binPath = path.join(process.cwd(), fileStorage);

    const organization = await Organization.getByRobotId(body.robotId);
    if (!organization || !organization.isUserAllowed(userId, [
      OrganizationPermissions.Admin,
      OrganizationPermissions.Analyst,
      OrganizationPermissions.Operator,
      OrganizationPermissions.Owner
    ])) {
      throw new Unauthorized();
    }

    const connectionId = new mongoose.Types.ObjectId();
    const robot = await Robot.findById(body.robotId);
    if (!robot) { throw new BadRequest('Robot not found'); };

    const robotStatus = await robot.getLatestStatus();
    if (!robotStatus || robotStatus.status !== RobotStatus.Operating || !robotStatus.context?.port) { throw new BadRequest('The robot is not ready for connection'); }

    const existingActiveConnection = await Connection.findOne({ robotId: body.robotId, isActive: true });
    if (existingActiveConnection) { throw new BadRequest('An active connection already exist'); };

    const connectionPort = randomIntFromInterval(10000, 19000);

    const execParams = `${binPath} --id ${connectionId} --robot-host ${robot.hostname} --robot-port ${robotStatus.context.port} --application-port ${connectionPort} --redis-connection-string redis://localhost:6379`;
    const neutronProcess = spawn(execParams, { shell: true });

    if (!neutronProcess.pid) { throw new ApplicationError('No PID for neutron process'); };
    const timeout = 4000; // 4 seconds
    const readyLine = `neutron connection ${connectionId} ready`;

    const waitForReadyLine = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        neutronProcess.kill();
        reject(new ApplicationError('Timeout waiting the connection server to start'));
      }, timeout);

      neutronProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        if (output.includes(readyLine)) {
          clearTimeout(timer);
          resolve();
        }
      });

      neutronProcess.once('error', err => {
        neutronProcess.kill();
        reject(err);
      });
    });

    neutronProcess.once('close', async () => {
      const connection = await Connection.findById(connectionId);
      if (!connection) { return; };
      connection.isActive = false;
      connection.closedAt = new Date();
      await connection.save();
    });

    neutronProcess.once('exit', () => {
      console.log('coucou');
    });

    await waitForReadyLine;

    const newConnection = new Connection({
      _id: connectionId,
      robotId: robot._id,
      isActive: true,
      createdBy: userId,
      pid: neutronProcess.pid,
      port: connectionPort
    });

    await newConnection.save();

    const registerId = randomUUID();
    await connectionApi.register(hostname, connectionPort, registerId);

    res.send({
      message: 'OK',
      connection: {
        _id: newConnection._id,
        hostname,
        port: connectionPort,
        registerId
      }
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(create, { validation: { body: createSchema } }), { roles: [UserRole.Verified] });
