import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import { randomUUID } from 'crypto';
import { withAuth } from '../../middleware/withAuth';
import requestMiddleware from '../../middleware/request-middleware';
import { UserRole } from '../../models/User';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import { BadRequest, Unauthorized } from '../../errors/bad-request';
import Connection from '../../models/Connection';
import * as connectionApi from '../../api/connection';
import ApplicationError from '../../errors/application-error';

export const joinSchema = Joi.object().keys({
  connectionId: Joi.string().required()
});

interface JoinConnectionParams {
    connectionId: string
}

const join: RequestHandler<any> = async (req: Request<JoinConnectionParams, {}, {}>, res, next) => {
  const { params } = req;
  const userId = (req as any).user.sub as string;

  try {
    if (!process.env.HOSTNAME) { throw new ApplicationError('HOSTNAME not defined'); };

    const connection = await Connection.findById(params.connectionId);
    if (!connection) { throw new BadRequest('The connection does not exist'); };

    const organization = await Organization.getByRobotId(connection.robotId.toString());
    if (!organization || !organization.isUserAllowed(userId, [
      OrganizationPermissions.Admin,
      OrganizationPermissions.Analyst,
      OrganizationPermissions.Operator,
      OrganizationPermissions.Owner
    ])) {
      throw new Unauthorized();
    }

    await connectionApi.register(process.env.HOSTNAME, connection.port, userId);

    res.send({
      message: 'OK',
      connection: {
        hostname: process.env.HOSTNAME,
        port: connection.port,
        registerId: userId,
        connectionId: connection.id
      }
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(join, { validation: { params: joinSchema } }), { role: UserRole.Verified });
