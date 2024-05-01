import { RequestHandler, Request } from 'express';
import Joi from 'joi';
import { withAuth } from '../../middleware/withAuth';
import requestMiddleware from '../../middleware/request-middleware';
import Robot from '../../models/Robot';
import Organization from '../../models/Organization';
import { BadRequest, Forbidden } from '../../errors/bad-request';
import { UserRole } from '../../models/User';

const deleteSchemaParams = Joi.object().keys({
  robotId: Joi.string().required()
});

interface DeleteSchema {
    robotId: string
}

const deleteRobot: RequestHandler<any> = async (
  req: Request<DeleteSchema, {}, {}>,
  res,
  next
) => {
  const { params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.getByRobotId(params.robotId);
    if (!organization) { throw new BadRequest('Organization not found'); };
    if (!organization.isUserAdmin(userId)) {
      throw new Forbidden('You need to be an organization admin');
    }

    await Robot.deleteOne({ _id: params.robotId }).exec();
    organization.robots = organization.robots.filter(e => e !== params.robotId);
    await organization.save();

    return res.json({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  deleteRobot,
  { validation: { params: deleteSchemaParams } }
), { role: UserRole.Verified });
