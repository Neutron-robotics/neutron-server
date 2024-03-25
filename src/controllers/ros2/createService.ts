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
import { ROS2ServiceMessageModel } from '../../models/Ros2/Ros2Messages';
import Ros2SystemModel from '../../models/Ros2/Ros2System';

interface CreateServiceBody {
    name: string,
    serviceTypeId: string,
  }

interface CreateServiceParams {
    robotId: string
    partId: string
}

const createServiceSchemaBody = Joi.object<CreateServiceBody>().keys({
  name: Joi.string().required(),
  serviceTypeId: Joi.string().required()
});

const createServiceSchemaParams = Joi.object<CreateServiceParams>().keys({
  robotId: Joi.string().required(),
  partId: Joi.string().required()
});

const createService: RequestHandler<any> = async (req: Request<CreateServiceParams, {}, CreateServiceBody>, res, next) => {
  const { body, params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.getByRobotId(params.robotId);
    if (!organization.isUserAllowed(userId, [OrganizationPermissions.Admin, OrganizationPermissions.Analyst, OrganizationPermissions.Operator, OrganizationPermissions.Owner])) {
      throw new Forbidden('User do not have the authorization for ros2 settings');
    };

    const robot = await Robot.findById(params.robotId);
    if (!robot) { throw new BadRequest('The robot does not exist'); };
    const part = robot.parts.find(e => e._id.toString() === params.partId);
    if (!part) { throw new BadRequest('The part does not exist'); };

    const serviceType = await ROS2ServiceMessageModel.findOne({ _id: body.serviceTypeId });
    if (!serviceType) { throw new BadRequest('The serviceType does not exist'); };

    const service = await ROS2ServiceModel.create({
      name: body.name,
      serviceType
    });

    const ros2System = await Ros2SystemModel.getByRobotId(robot.id);
    ros2System.services.push(service.id);
    await ros2System.save();

    part.services.push(service.id);
    await robot.save();

    res.send({
      message: 'OK',
      id: service.id
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  createService,
  { validation: { params: createServiceSchemaParams, body: createServiceSchemaBody } }
), { role: UserRole.Verified });
