import { RequestHandler, Request } from 'express-serve-static-core';
import Joi from 'joi';
import Robot from '../../models/Robot';
import { withAuth } from '../../middleware/withAuth';
import requestMiddleware from '../../middleware/request-middleware';
import { UserRole } from '../../models/User';
import { partsSchema } from '../robot/create';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import { BadRequest, Forbidden } from '../../errors/bad-request';
import RobotPart, { RobotPartCategory } from '../../models/RobotPart';

export interface CreateRobotPart {
  type: string
  category: RobotPartCategory
  name: string
  imgUrl: string
  ros2Node: string,
  ros2Package: string
}

interface CreatePartSchema {
    robotId: string
}

const createSchemaParams = Joi.object<CreatePartSchema>().keys({
  robotId: Joi.string().required()
});

const create: RequestHandler<any> = async (req: Request<CreatePartSchema, {}, CreateRobotPart>, res, next) => {
  const { body, params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.getByRobotId(params.robotId);
    if (!organization.isUserAllowed(userId, [OrganizationPermissions.Admin, OrganizationPermissions.Analyst, OrganizationPermissions.Operator, OrganizationPermissions.Owner])) {
      throw new Forbidden('User do not have the authorization for creating a new part');
    };

    const robot = await Robot.findOne({ _id: params.robotId });
    if (!robot) { throw new BadRequest('The robot could not be found'); };

    const robotPart = new RobotPart(body);
    robot.parts.push(robotPart);
    await robot.save();
    res.send({
      message: 'OK',
      id: robotPart.id
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  create,
  { validation: { params: createSchemaParams, body: partsSchema } }
), { roles: [UserRole.Verified] });
