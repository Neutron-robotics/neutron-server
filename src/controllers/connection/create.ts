import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import path from 'path';
import mongoose from 'mongoose';
import { spawn } from 'child_process';
import { withAuth } from '../../middleware/withAuth';
import requestMiddleware from '../../middleware/request-middleware';
import { UserRole } from '../../models/User';
import ApplicationError from '../../errors/application-error';
import Robot from '../../models/Robot';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import { BadRequest, Unauthorized } from '../../errors/bad-request';
import { randomIntFromInterval } from '../../utils/random';
import Connection from '../../models/Connection';
import { RobotStatus } from '../../models/RobotStatus';
import * as agentApi from '../../api/connection';
import logger, { connectionLogger } from '../../logger';

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
    if (!robotStatus || robotStatus.status !== RobotStatus.Operating || !robotStatus.context?.port || !robotStatus.port) { throw new BadRequest('The robot is not ready for connection'); }

    const existingActiveConnection = await Connection.findOne({ robotId: body.robotId, isActive: true });
    if (existingActiveConnection) { throw new BadRequest('An active connection already exist'); };

    const connectionPort = randomIntFromInterval(12000, 14000);

    // The robot context port for bridging connection is always the default port + 1
    const execParams = `${binPath} --id ${connectionId} --robot-host rsshd --robot-port ${robotStatus.port + 1} --application-port ${connectionPort} --application-timeout ${process.env.CONNECTION_MAX_IDLE_TIME}`;
    const neutronProcess = spawn(execParams, { shell: true });

    logger.info(`Create connection with exec param: ${execParams}`);

    if (!neutronProcess.pid) { throw new ApplicationError('No PID for neutron process'); };
    const timeout = 4000; // 4 seconds
    const readyLine = `neutron connection ${connectionId} ready`;

    neutronProcess.stdout.on('data', (data: Buffer) => {
      const output = data.toString();
      const msgs = output.split('\n');
      msgs.forEach(msg => {
        if (!msg.length) return;
        logger.info(`C [${connectionId}] Logged message: ${execParams}`);
        connectionLogger.info(msg, {
          organizationId: organization.id,
          robotId: robot.id
        });
      });
    });

    const waitForReadyLine = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        neutronProcess.kill();
        logger.error('Connection has timeout before it started', {
          connectionId,
          userId,
          path: req.path
        });
        reject(new ApplicationError('Timeout waiting the connection server to start'));
      }, timeout);

      neutronProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        if (output.includes(readyLine)) {
          logger.info('Connection has started successfuly', {
            connectionId,
            userId,
            path: req.path
          });
          clearTimeout(timer);
          resolve();
        }
      });

      neutronProcess.once('error', err => {
        logger.error(`Connection error: ${err.message}`, {
          connectionId,
          userId,
          path: req.path
        });
        neutronProcess.kill();
        reject(err);
      });
    });

    neutronProcess.once('close', async () => {
      try {
        const connection = await Connection.findById(connectionId);
        if (!connection) { return; };
        connection.isActive = false;
        connection.closedAt = new Date();
        await connection.save();
        await agentApi.stopRobot(robot.hostname, 8000); // todo handle port
        logger.info('Connection has stopped successfuly', {
          connectionId,
          userId,
          path: req.path
        });
      } catch (err: any) {
        logger.error(`Error when attempting to close connection ${err.message}`, {
          connectionId,
          userId,
          path: req.path
        });
      }
    });

    neutronProcess.once('exit', () => {
      logger.warn('Connection has exited, is this the desired behavior ?', {
        connectionId,
        userId,
        path: req.path
      });
    });

    await waitForReadyLine;

    logger.info(`Connection ${connectionId} has started successfully`);

    const newConnection = new Connection({
      _id: connectionId,
      robotId: robot._id,
      isActive: true,
      createdBy: userId,
      pid: neutronProcess.pid,
      port: connectionPort
    });

    await newConnection.save();

    logger.info('registering api');
    await agentApi.register('localhost', connectionPort, userId);
    logger.info('registering api done, OK');

    res.send({
      message: 'OK',
      connection: {
        connectionId: newConnection._id,
        hostname,
        port: connectionPort,
        registerId: userId
      }
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(create, { validation: { body: createSchema } }), { role: UserRole.Verified });
