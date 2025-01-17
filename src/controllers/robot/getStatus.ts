import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import { randomUUID } from 'crypto';
import moment from 'moment';
import requestMiddleware from '../../middleware/request-middleware';
import { BadRequest, Forbidden } from '../../errors/bad-request';
import Robot, { ConnectionContextType } from '../../models/Robot';
import { withAuth } from '../../middleware/withAuth';
import { UserRole } from '../../models/User';
import Organization from '../../models/Organization';
import ApplicationError from '../../errors/application-error';
import RobotStatusModel, { IRobotStatus, RobotStatus } from '../../models/RobotStatus';

const getStatusRobotSchemaParam = Joi.object().keys({
  robotId: Joi.string().required()
});

interface UpdateQuery {
    robotId: string
}

const getStatus: RequestHandler<any> = async (
  req: Request<UpdateQuery, {}, {}>,
  res,
  next
) => {
  const { params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const robot = await Robot.findOne({ _id: params.robotId }).exec();
    if (!robot) {
      throw new BadRequest('Robot not found');
    }

    if (!robot.linked) {
      throw new BadRequest('Robot not linked');
    }

    const organization = await Organization.getByRobotId(robot.id);
    if (!organization.users.some(e => e.userId.toString() === userId)) {
      throw new Forbidden('You do not belong to the organization');
    }

    const status = await robot.getLatestStatus()
    ?? {
      _id: randomUUID(),
      time: new Date('2020-01-01'),
      status: RobotStatus.Offline,
      robot: robot.id
    } as IRobotStatus;

    res.json({
      message: 'OK',
      status
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  getStatus,
  { validation: { params: getStatusRobotSchemaParam } }
), { role: UserRole.Verified });
