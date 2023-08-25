import { RequestHandler, Request } from 'express';
import Joi from 'joi';
import { withAuth } from '../../middleware/withAuth';
import requestMiddleware from '../../middleware/request-middleware';
import { UserRole } from '../../models/User';
import { BadRequest, Forbidden } from '../../errors/bad-request';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import RobotPart from '../../models/RobotPart';
import ROS2ServiceModel from '../../models/Ros2/Ros2Service';
import Robot from '../../models/Robot';
import Ros2SystemModel from '../../models/Ros2/Ros2System';

interface DeleteServiceParams {
    robotId: string
    partId: string
    serviceId: string
}

const deleteServiceSchemaParams = Joi.object<DeleteServiceParams>().keys({
  robotId: Joi.string().required(),
  partId: Joi.string().required(),
  serviceId: Joi.string().required()
});

const deleteService: RequestHandler<any> = async (req: Request<DeleteServiceParams, {}, {}>, res, next) => {
  const { params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.getByRobotId(params.robotId);
    if (!organization.isUserAllowed(userId, [OrganizationPermissions.Admin, OrganizationPermissions.Analyst, OrganizationPermissions.Operator, OrganizationPermissions.Owner])) {
      throw new Forbidden('User do not have the authorization for deleting ros2 related protocol');
    };

    const robot = await Robot.findById(params.robotId);
    if (!robot) { throw new BadRequest('The robot does not exist'); };
    const part = robot.parts.find(e => e._id.toString() === params.partId);
    if (!part) { throw new BadRequest('The part does not exist'); };

    const ros2System = await Ros2SystemModel.getByRobotId(robot.id);
    ros2System.services = ros2System.services.filter(e => e._id.toString() !== params.serviceId);
    await ros2System.save();

    await ROS2ServiceModel.deleteOne({ _id: params.serviceId });

    res.send({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  deleteService,
  { validation: { params: deleteServiceSchemaParams } }
), { roles: [UserRole.Verified] });