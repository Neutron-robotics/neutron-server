import { RequestHandler, Request } from 'express';
import Joi from 'joi';
import { withAuth } from '../../middleware/withAuth';
import requestMiddleware from '../../middleware/request-middleware';
import { UserRole } from '../../models/User';
import { BadRequest, Forbidden } from '../../errors/bad-request';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import RobotPart from '../../models/RobotPart';
import ROS2ActionModel from '../../models/Ros2/Ros2Action';
import Robot from '../../models/Robot';
import { ROS2ActionMessageModel } from '../../models/Ros2/Ros2Messages';
import Ros2SystemModel from '../../models/Ros2/Ros2System';

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
    const robot = await Robot.findById(params.robotId);
    if (!robot) { throw new BadRequest('The robot does not exist'); };
    const part = robot.parts.find(e => e._id.toString() === params.partId);
    if (!part) { throw new BadRequest('The part does not exist'); };

    const actionType = await ROS2ActionMessageModel.findOne({ _id: body.actionTypeId });
    if (!actionType) { throw new BadRequest('The action type does not exist'); };

    const action = await ROS2ActionModel.create({
      actionType,
      name: body.name
    });

    const ros2System = await Ros2SystemModel.getByRobotId(robot.id);
    ros2System.actions.push(action.id);
    await ros2System.save();

    part.actions.push(action.id);
    await robot.save();

    res.send({
      message: 'OK',
      id: action.id
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  createAction,
  { validation: { params: createActionSchemaParams, body: createActionSchemaBody } }
), { role: UserRole.Verified });
