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

interface GetConnectionByRobotParams {
  robotId: string
}

const getConnectionByRobotSchemaParams = Joi.object<GetConnectionByRobotParams>().keys({
  robotId: Joi.string().required()
});

const getConnectionByRobotId: RequestHandler<any> = async (
  req: Request<GetConnectionByRobotParams, {}, {}>,
  res,
  next
) => {
  const { params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const robot = await Robot.findById(params.robotId);
    if (!robot) throw new ApplicationError('No robot found');

    const organization = await Organization.getByRobotId(robot.id);
    if (!organization || !organization.users.find(e => e.userId.toString() === userId)) { throw new Forbidden(); };

    const connections = await Connection.find({ robotId: params.robotId });
    if (!connections) throw new BadRequest('No connection found');

    return res.json({
      message: 'OK',
      connection: connections.map(e => e.toDTOModel(robot))
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  getConnectionByRobotId,
  { validation: { params: getConnectionByRobotSchemaParams } }
), { role: UserRole.Verified });
