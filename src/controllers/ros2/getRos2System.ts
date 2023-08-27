import { RequestHandler, Request } from 'express';
import Joi from 'joi';
import { withAuth } from '../../middleware/withAuth';
import requestMiddleware from '../../middleware/request-middleware';
import { UserRole } from '../../models/User';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import { BadRequest, Forbidden } from '../../errors/bad-request';
import Robot from '../../models/Robot';
import Ros2SystemModel from '../../models/Ros2/Ros2System';

interface GetRos2SystemParams {
    robotId: string
    partId: string
    actionId: string
}

const getRos2SystemSchemaParams = Joi.object<GetRos2SystemParams>().keys({
  robotId: Joi.string().required()
});

const getRos2System: RequestHandler<any> = async (req: Request<GetRos2SystemParams, {}, {}>, res, next) => {
  const { params } = req;
  const userId = (req as any).user.sub as string;
  try {
    const organization = await Organization.getByRobotId(params.robotId);
    if (!organization.isUserAllowed(userId, [OrganizationPermissions.Admin, OrganizationPermissions.Analyst, OrganizationPermissions.Operator, OrganizationPermissions.Owner, OrganizationPermissions.Guest])) {
      throw new Forbidden('User do not have the authorization for deleting ros2 related protocol');
    };

    const robot = await Robot.findById(params.robotId);
    if (!robot) { throw new BadRequest('The robot does not exist'); };

    const model = await Ros2SystemModel.getByRobotId(robot.id);
    const populatedModel = await Ros2SystemModel.populate(model, [
      { path: 'topics' },
      { path: 'publishers' },
      { path: 'subscribers' },
      { path: 'actions' },
      { path: 'services' }
    ]);
    res.send({
      message: 'OK',
      model: populatedModel
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  getRos2System,
  { validation: { params: getRos2SystemSchemaParams } }
), { roles: [UserRole.Verified] });
