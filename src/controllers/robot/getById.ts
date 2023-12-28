import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import { withAuth } from '../../middleware/withAuth';
import { UserRole } from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { Forbidden, NotFound } from '../../errors/bad-request';
import Organization from '../../models/Organization';
import Robot from '../../models/Robot';

interface GetRobotParams {
    robotId: string
}

const getRobotSchemaParams = Joi.object<GetRobotParams>().keys({
  robotId: Joi.string().required()
});

const getById: RequestHandler<any> = async (
  req: Request<GetRobotParams, {}, {}>,
  res,
  next
) => {
  const { params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const robot = await Robot.findById(params.robotId).lean();

    if (!robot) throw new NotFound();

    const organization = await Organization.getByRobotId(robot._id);

    if (!organization || !organization.users.find(e => e.userId.toString() === userId)) { throw new Forbidden(); };

    const sanitizedRobot = robot?.linked ? { ...robot, secretKey: undefined } : robot;

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
  { validation: { params: getRobotSchemaParams } }
), { roles: [UserRole.Verified] });
