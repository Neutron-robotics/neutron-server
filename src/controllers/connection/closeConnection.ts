import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import { withAuth } from '../../middleware/withAuth';
import requestMiddleware from '../../middleware/request-middleware';
import { UserRole } from '../../models/User';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import { BadRequest, Unauthorized } from '../../errors/bad-request';
import Connection from '../../models/Connection';

export const closeSchema = Joi.object().keys({
  connectionId: Joi.string().required()
});

interface CloseConnectionParams {
    connectionId: string
}

const closeConnection: RequestHandler<any> = async (req: Request<CloseConnectionParams, {}, {}>, res, next) => {
  const { params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const connection = await Connection.findById(params.connectionId);
    if (!connection) { throw new BadRequest('The connection does not exist'); };

    if (!connection.isActive) {
      res.send({ message: 'OK' });
      return;
    }

    const organization = await Organization.getByRobotId(connection.robotId.toString());
    if (!organization || !organization.isUserAllowed(userId, [
      OrganizationPermissions.Admin,
      OrganizationPermissions.Analyst,
      OrganizationPermissions.Operator,
      OrganizationPermissions.Owner
    ])) {
      throw new Unauthorized();
    }

    process.kill(+connection.pid, 'SIGINT');

    connection.isActive = false;
    connection.closedAt = new Date();
    await connection.save();

    res.send({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(closeConnection, { validation: { params: closeSchema } }), { role: UserRole.Verified });
