import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import { withAuth } from '../../middleware/withAuth';
import { UserRole } from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { Forbidden, NotFound } from '../../errors/bad-request';
import Organization from '../../models/Organization';
import Robot from '../../models/Robot';

interface GetRobotsParams {
    organization: string
}

const getRobotsSchemaParams = Joi.object<GetRobotsParams>().keys({
  organization: Joi.string().required()
});

const getOrganizationRobots: RequestHandler<any> = async (
  req: Request<GetRobotsParams, {}, {}>,
  res,
  next
) => {
  const { params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.findOne({ name: params.organization }).exec();
    if (!organization) { throw new NotFound(); };
    if (!organization.users.find(e => e.userId.toString() === userId)) { throw new Forbidden(); };

    const robots = await Robot.find({ _id: { $in: organization.robots } }).lean();
    const robotsDto = robots.map(e => {
      const { secretKey, ...robotDto } = e;
      return robotDto;
    });
    return res.json({
      message: 'OK',
      robots: robotsDto
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  getOrganizationRobots,
  { validation: { params: getRobotsSchemaParams } }
), { roles: [UserRole.Verified] });
