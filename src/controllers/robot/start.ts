import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import axios from 'axios';
import { withAuth } from '../../middleware/withAuth';
import { UserRole } from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { Forbidden, NotFound } from '../../errors/bad-request';
import Organization from '../../models/Organization';
import Robot from '../../models/Robot';
import { startRobot } from '../../api/connection';
import ApplicationError from '../../errors/application-error';

interface StartRobotParams {
    robotId: string
}

interface StartRobotBody {
    partsId?: string[]
}

const startSchemaBody = Joi.object<StartRobotBody>().keys({
  partsId: Joi.array()
    .items(Joi.string())
    .optional()
});

const startSchemaParams = Joi.object<StartRobotParams>().keys({
  robotId: Joi.string().required()
});

const start: RequestHandler<any> = async (
  req: Request<StartRobotParams, {}, StartRobotBody>,
  res,
  next
) => {
  const { params, body } = req;
  const userId = (req as any).user.sub as string;

  try {
    const robot = await Robot.findById(params.robotId);

    if (!robot) throw new NotFound();

    const organization = await Organization.getByRobotId(robot._id);

    if (!organization || !organization.users.find(e => e.userId.toString() === userId)) { throw new Forbidden(); };

    const parts = await robot.parts.filter(e => body?.partsId?.includes(e._id.toString()) ?? true);

    const latestRobotStatus = await robot.getLatestStatus();
    if (!latestRobotStatus?.port) throw new ApplicationError('The latest robot status does not contain a valid port');

    const processesId = parts.length === 0 ? undefined : parts.map(e => e._id);
    await startRobot('rsshd', latestRobotStatus.port, processesId); // todo handle context type and adapt hostname

    return res.json({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  start,
  { validation: { params: startSchemaParams, body: startSchemaBody } }
), { role: UserRole.Verified });
