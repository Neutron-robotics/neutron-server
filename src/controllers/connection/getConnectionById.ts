import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import { withAuth } from '../../middleware/withAuth';
import { UserRole } from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { BadRequest, Forbidden, NotFound } from '../../errors/bad-request';
import Organization from '../../models/Organization';
import Robot from '../../models/Robot';
import Connection from '../../models/Connection';
import ApplicationError from '../../errors/application-error';

interface GetConnectionParams {
  connectionId: string
}

const getConnectionSchemaParams = Joi.object<GetConnectionParams>().keys({
  connectionId: Joi.string().required()
});

const getConnectionById: RequestHandler<any> = async (
  req: Request<GetConnectionParams, {}, {}>,
  res,
  next
) => {
  const { params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const connection = await Connection.findById(params.connectionId);
    if (!connection) throw new BadRequest('No connection found');

    const robot = await Robot.findById(connection.robotId);
    if (!robot) throw new ApplicationError('The robot associated with this robot has been deleted');

    const organization = await Organization.getByRobotId(robot.id);
    if (!organization || !organization.users.find(e => e.userId.toString() === userId)) { throw new Forbidden(); };

    return res.json({
      message: 'OK',
      connection: connection.toDTOModel(robot)
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  getConnectionById,
  { validation: { params: getConnectionSchemaParams } }
), { roles: [UserRole.Verified] });
