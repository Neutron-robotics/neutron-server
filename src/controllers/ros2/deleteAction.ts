import { RequestHandler, Request } from 'express';
import Joi from 'joi';
import { withAuth } from '../../middleware/withAuth';
import requestMiddleware from '../../middleware/request-middleware';
import { UserRole } from '../../models/User';
import { BadRequest, Forbidden } from '../../errors/bad-request';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import ROS2ActionModel from '../../models/Ros2/Ros2Action';
import RobotPart from '../../models/RobotPart';

interface DeleteActionParams {
    robotId: string
    partId: string
    actionId: string
}

const deleteActionSchemaParams = Joi.object<DeleteActionParams>().keys({
  robotId: Joi.string().required(),
  partId: Joi.string().required(),
  actionId: Joi.string().required()
});

const deleteAction: RequestHandler<any> = async (req: Request<DeleteActionParams, {}, {}>, res, next) => {
  const { params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.getByRobotId(params.robotId);
    if (!organization.isUserAllowed(userId, [OrganizationPermissions.Admin, OrganizationPermissions.Analyst, OrganizationPermissions.Operator, OrganizationPermissions.Owner])) {
      throw new Forbidden('User do not have the authorization for deleting ros2 related protocol');
    };

    const part = await RobotPart.findOne({ _id: params.partId });
    if (!part) { throw new BadRequest('The part does not exist'); };

    await ROS2ActionModel.deleteOne({ _id: params.actionId });

    res.send({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  deleteAction,
  { validation: { params: deleteActionSchemaParams } }
), { roles: [UserRole.Verified] });
