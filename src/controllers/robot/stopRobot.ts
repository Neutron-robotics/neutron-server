import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import axios from 'axios';
import { withAuth } from '../../middleware/withAuth';
import { UserRole } from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { Forbidden, NotFound } from '../../errors/bad-request';
import Organization from '../../models/Organization';
import Robot from '../../models/Robot';

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
    const robot = await Robot.findById(params.robotId).lean();

    if (!robot) throw new NotFound();

    const organization = await Organization.getByRobotId(robot._id);

    if (!organization || !organization.users.find(e => e.userId.toString() === userId)) { throw new Forbidden(); };

    const response = await axios.post(`http://${robot.hostname}:8000/robot/stop`);
    if (response.status !== 200) throw new Error(response.data);

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
), { roles: [UserRole.Verified] });
