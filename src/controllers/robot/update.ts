import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import requestMiddleware from '../../middleware/request-middleware';
import { BadRequest, Forbidden } from '../../errors/bad-request';
import Robot, { ConnectionContextType, RobotPartCategory } from '../../models/Robot';
import { withAuth } from '../../middleware/withAuth';
import { UserRole } from '../../models/User';
import Organization from '../../models/Organization';
import ApplicationError from '../../errors/application-error';

const updateRobotSchemaBody = Joi.object().keys({
  name: Joi.string(),
  imgUrl: Joi.string().uri(),
  description: Joi.string(),
  connectionContextType: Joi.string().valid(Object.values(ConnectionContextType))
});

interface UpdateBody {
    name: string | undefined
    imgUrl: string | undefined
    description: string | undefined
    connectionContextType: ConnectionContextType | undefined
}

interface UpdateQuery {
    robotId: string
}

const getConfiguration: RequestHandler<any> = async (
  req: Request<UpdateQuery, {}, UpdateBody>,
  res,
  next
) => {
  const { body, params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const robot = await Robot.findOne({ id: params.robotId }).exec();
    if (!robot) {
      throw new BadRequest('Robot not found');
    }

    const organization = Organization.getByRobotId(robot.id);
    if (!organization) {
      throw new ApplicationError('The robot does not belong to an organization');
    }

    if (!organization.users.some(e => e.userId === userId)) {
      throw new Forbidden('You do not belong to the organization');
    }

    if (body.name) { robot.name = body.name; }
    if (body.imgUrl) { robot.imgUrl = body.imgUrl; }
    if (body.description) { robot.description = body.description; }
    if (body.connectionContextType) { robot.context = body.connectionContextType; }

    res.json({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  getConfiguration,
  { validation: { body: updateRobotSchemaBody } }
), { roles: [UserRole.Verified] });
