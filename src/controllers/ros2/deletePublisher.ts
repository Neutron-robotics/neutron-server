import { RequestHandler, Request } from 'express';
import Joi from 'joi';
import { withAuth } from '../../middleware/withAuth';
import requestMiddleware from '../../middleware/request-middleware';
import { UserRole } from '../../models/User';
import { BadRequest, Forbidden } from '../../errors/bad-request';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import ROS2PublisherModel from '../../models/Ros2/Ros2Publisher';
import RobotPart from '../../models/RobotPart';

interface DeletePublisherParams {
    robotId: string
    partId: string
    publisherId: string
}

const deletePublisherSchemaParams = Joi.object<DeletePublisherParams>().keys({
  robotId: Joi.string().required(),
  partId: Joi.string().required()
});

const deletePublisher: RequestHandler<any> = async (req: Request<DeletePublisherParams, {}, {}>, res, next) => {
  const { params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.getByRobotId(params.robotId);
    if (!organization.isUserAllowed(userId, [OrganizationPermissions.Admin, OrganizationPermissions.Analyst, OrganizationPermissions.Operator, OrganizationPermissions.Owner])) {
      throw new Forbidden('User do not have the authorization for deleting ros2 related protocol');
    };

    const part = await RobotPart.findOne({ _id: params.partId });
    if (!part) { throw new BadRequest('The part does not exist'); };

    await ROS2PublisherModel.deleteOne({ _id: params.publisherId });

    res.send({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  deletePublisher,
  { validation: { params: deletePublisherSchemaParams } }
), { roles: [UserRole.Verified] });
