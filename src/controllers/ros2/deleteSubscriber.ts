import { RequestHandler, Request } from 'express';
import Joi from 'joi';
import { withAuth } from '../../middleware/withAuth';
import requestMiddleware from '../../middleware/request-middleware';
import { UserRole } from '../../models/User';
import { BadRequest, Forbidden } from '../../errors/bad-request';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import RobotPart from '../../models/RobotPart';
import ROS2SubscriberModel from '../../models/Ros2/Ros2Subscriber';

interface DeleteSubscriberParams {
    robotId: string
    partId: string
    subscriberId: string
}

const deleteSubscriberSchemaParams = Joi.object<DeleteSubscriberParams>().keys({
  robotId: Joi.string().required(),
  partId: Joi.string().required(),
  subscriberId: Joi.string().required()
});

const deleteSubscriber: RequestHandler<any> = async (req: Request<DeleteSubscriberParams, {}, {}>, res, next) => {
  const { params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.getByRobotId(params.robotId);
    if (!organization.isUserAllowed(userId, [OrganizationPermissions.Admin, OrganizationPermissions.Analyst, OrganizationPermissions.Operator, OrganizationPermissions.Owner])) {
      throw new Forbidden('User do not have the authorization for deleting ros2 related protocol');
    };

    const part = await RobotPart.findOne({ _id: params.partId });
    if (!part) { throw new BadRequest('The part does not exist'); };

    await ROS2SubscriberModel.deleteOne({ _id: params.subscriberId });

    res.send({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  deleteSubscriber,
  { validation: { params: deleteSubscriberSchemaParams } }
), { roles: [UserRole.Verified] });
