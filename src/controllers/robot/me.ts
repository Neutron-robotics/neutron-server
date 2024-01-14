import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import moment from 'moment';
import { withAuth } from '../../middleware/withAuth';
import { UserRole } from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { Forbidden, NotFound } from '../../errors/bad-request';
import Organization from '../../models/Organization';
import Robot from '../../models/Robot';
import RobotStatusModel, { RobotStatus } from '../../models/RobotStatus';

const getMyRobotsQueryParams = Joi.object().keys({
  includeStatus: Joi.string().optional()
});

interface GetMyRobotsQueryParams {
    includeStatus?: string
}

const me: RequestHandler<any> = async (
  req: Request<{}, {}, {}, GetMyRobotsQueryParams>,
  res,
  next
) => {
  const { query } = req;
  const userId = (req as any).user.sub as string;

  try {
    const myOrganizations = (await Organization
      .find({ users: { $elemMatch: { userId, permissions: 'owner' } }, active: true })
      .lean()
      .exec())
      .map(({ active, ...rest }) => rest);

    const robotsIds = myOrganizations.map(({ robots }) => robots).flat();

    const robots = await Robot.find({ _id: { $in: robotsIds } });

    const robotsDto = await Promise.all(robots.map(async e => {
      if (e.linked) {
        if (query.includeStatus === 'true') {
          const latestStatus = await e.getLatestStatus();
          // remove additional properties of the robot (e)
          const { secretKey, ...robotDto } = e.toJSON();
          return {
            ...robotDto,
            status: latestStatus
          };
        }
        const { secretKey, ...robotDto } = e;
        return robotDto;
      }
      return e;
    }));

    return res.json({
      message: 'OK',
      robots: robotsDto
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(
  requestMiddleware(me, {
    validation: {
      query: getMyRobotsQueryParams
    }
  }),
  { roles: [UserRole.Verified] }
);
