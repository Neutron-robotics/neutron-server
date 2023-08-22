import { RequestHandler, Request } from 'express';
import Joi from 'joi';
import { withAuth } from '../../middleware/withAuth';
import requestMiddleware from '../../middleware/request-middleware';
import { UserRole } from '../../models/User';
import { BadRequest, Forbidden } from '../../errors/bad-request';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import RobotPart from '../../models/RobotPart';
import ROS2ActionModel from '../../models/Ros2/Ros2Action';

interface CreateActionBody {
    name: string
    actionTypeId: string
}

interface CreateActionParams {
    robotId: string
    partId: string
}

const createActionSchemaBody = Joi.object<CreateActionBody>().keys({
  name: Joi.string().required(),
  actionTypeId: Joi.string().required()
});

const createActionSchemaParams = Joi.object<CreateActionParams>().keys({
  robotId: Joi.string().required(),
  partId: Joi.string().required()
});

const createAction: RequestHandler<any> = async (req: Request<CreateActionParams, {}, CreateActionBody>, res, next) => {
  const { body, params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.getByRobotId(params.robotId);
    if (!organization.isUserAllowed(userId, [OrganizationPermissions.Admin, OrganizationPermissions.Analyst, OrganizationPermissions.Operator, OrganizationPermissions.Owner])) {
      throw new Forbidden('User do not have the authorization for ros2 settings');
    };
    const part = await RobotPart.findOne({ _id: params.partId });
    if (!part) { throw new BadRequest('The part does not exist'); };

    const actionType = ROS2ActionModel.findOne({ _id: body.actionTypeId });
    if (!actionType) { throw new BadRequest('The action type does not exist'); };

    await ROS2ActionModel.create({
      actionType,
      name: body.name
    });

    res.send({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  createAction,
  { validation: { params: createActionSchemaParams, body: createActionSchemaBody } }
), { roles: [UserRole.Verified] });
