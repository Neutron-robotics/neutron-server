import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import { withAuth } from '../../middleware/withAuth';
import { UserRole } from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { Forbidden, NotFound } from '../../errors/bad-request';
import Organization from '../../models/Organization';
import Robot from '../../models/Robot';
import * as agentApi from '../../api/connection';
import ApplicationError from '../../errors/application-error';

interface StopRobotParams {
    robotId: string
}

const stopSchemaParams = Joi.object<StopRobotParams>().keys({
  robotId: Joi.string().required()
});

const stopRobot: RequestHandler<any> = async (
  req: Request<StopRobotParams, {}, {}>,
  res,
  next
) => {
  const { params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const robot = await Robot.findById(params.robotId);

    if (!robot) throw new NotFound();

    const organization = await Organization.getByRobotId(robot._id);

    if (!organization || !organization.users.find(e => e.userId.toString() === userId)) { throw new Forbidden(); };

    const latestRobotStatus = await robot.getLatestStatus();
    if (!latestRobotStatus?.port) throw new ApplicationError('The latest robot status does not contain a valid port');

    await agentApi.stopRobot('rsshd', latestRobotStatus.port);

    return res.json({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  stopRobot,
  { validation: { params: stopSchemaParams } }
), { role: UserRole.Verified });
