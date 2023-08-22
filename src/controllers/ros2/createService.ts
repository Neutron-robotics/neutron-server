import { RequestHandler, Request } from 'express';
import Joi from 'joi';
import { withAuth } from '../../middleware/withAuth';
import requestMiddleware from '../../middleware/request-middleware';
import { UserRole } from '../../models/User';
import { BadRequest, Forbidden } from '../../errors/bad-request';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import RobotPart from '../../models/RobotPart';
import ROS2ServiceModel from '../../models/Ros2/Ros2Service';

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

    const part = await RobotPart.findOne({ _id: params.partId });
    if (!part) { throw new BadRequest('The part does not exist'); };

    const serviceType = ROS2ServiceModel.findOne({ _id: body.serviceTypeId });
    if (!serviceType) { throw new BadRequest('The serviceType does not exist'); };

    await ROS2ServiceModel.create({
      name: body.name,
      serviceType
    });

    res.send({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  createService,
  { validation: { params: createServiceSchemaParams, body: createServiceSchemaBody } }
), { roles: [UserRole.Verified] });
