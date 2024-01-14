import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import { withAuth } from '../../middleware/withAuth';
import { UserRole } from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { Forbidden, NotFound } from '../../errors/bad-request';
import Organization from '../../models/Organization';
import Robot from '../../models/Robot';
import RobotStatusModel from '../../models/RobotStatus';

interface GetRobotParams {
  robotId: string
}

const getRobotSchemaParams = Joi.object<GetRobotParams>().keys({
  robotId: Joi.string().required()
});

const getRobotQueryParams = Joi.object().keys({
  includeStatus: Joi.string().optional()
});

interface GetRobotQueryParams {
    includeStatus?: string
}

const getById: RequestHandler<any> = async (
  req: Request<GetRobotParams, {}, {}, GetRobotQueryParams>,
  res,
  next
) => {
  const { params, query } = req;
  const userId = (req as any).user.sub as string;

  try {
    const robot = await Robot.findById(params.robotId);

    if (!robot) throw new NotFound();

    const organization = await Organization.getByRobotId(robot._id);

    if (!organization || !organization.users.find(e => e.userId.toString() === userId)) { throw new Forbidden(); };

    const latestStatus = query.includeStatus ? await robot.getLatestStatus() : undefined;
    const sanitizedRobot = robot?.linked ? { ...robot.toJSON(), secretKey: undefined, status: latestStatus } : robot.toJSON();

    return res.json({
      message: 'OK',
      robot: sanitizedRobot
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  getById,
  { validation: { params: getRobotSchemaParams, query: getRobotQueryParams } }
), { roles: [UserRole.Verified] });
