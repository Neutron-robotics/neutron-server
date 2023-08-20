import { RequestHandler, Request } from 'express-serve-static-core';
import Joi from 'joi';
import Robot from '../../models/Robot';
import { withAuth } from '../../middleware/withAuth';
import requestMiddleware from '../../middleware/request-middleware';
import { UserRole } from '../../models/User';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import { BadRequest, Forbidden } from '../../errors/bad-request';
import { CreateRobotPart } from './create';
import { RobotPartCategory } from '../../models/RobotPart';

interface UpdatePartSchema {
    robotId: string
    partId: string
}

interface UpdateRobotPart extends Partial<CreateRobotPart> {}

const updatePartsSchema = Joi.object<UpdateRobotPart>().keys({
  type: Joi.string().optional(),
  category: Joi.string().valid(...Object.values(RobotPartCategory)).optional(),
  name: Joi.string().optional(),
  imgUrl: Joi.optional()
});

const updateSchemaParams = Joi.object<UpdatePartSchema>().keys({
  robotId: Joi.string().required(),
  partId: Joi.string().required()
});

const update: RequestHandler<any> = async (req: Request<UpdatePartSchema, {}, UpdateRobotPart>, res, next) => {
  const { body, params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.getByRobotId(params.robotId);
    if (!organization.isUserAllowed(
      userId,
      [OrganizationPermissions.Admin,
        OrganizationPermissions.Analyst,
        OrganizationPermissions.Owner,
        OrganizationPermissions.Operator]
    )) {
      throw new Forbidden('User do not have the authorization for creating a new part');
    };

    const robot = await Robot.findOne({ _id: params.robotId });
    if (!robot) { throw new BadRequest('The robot could not be found'); };

    const part = robot.parts.find(e => e._id.toString() === params.partId);
    if (!part) {
      throw new BadRequest('The robot part not be found');
    }

    if (body.name) { part.name = body.name; }
    if (body.imgUrl) { part.imgUrl = body.imgUrl; }
    if (body.type) { part.type = body.type; }
    if (body.category) { part.category = body.category; }

    await robot.save();

    res.json({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  update,
  { validation: { params: updateSchemaParams, body: updatePartsSchema } }
), { roles: [UserRole.Verified] });
