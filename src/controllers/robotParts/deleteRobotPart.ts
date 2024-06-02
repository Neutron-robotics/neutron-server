import { RequestHandler, Request } from 'express-serve-static-core';
import Joi from 'joi';
import Robot from '../../models/Robot';
import { withAuth } from '../../middleware/withAuth';
import requestMiddleware from '../../middleware/request-middleware';
import { UserRole } from '../../models/User';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import { BadRequest, Forbidden } from '../../errors/bad-request';

interface DeletePartSchema {
    robotId: string
    partId: string
}

const deletePartSchemaParams = Joi.object<DeletePartSchema>().keys({
  robotId: Joi.string().required(),
  partId: Joi.string().required()
});

const deleteRobotPart: RequestHandler<any> = async (req: Request<DeletePartSchema, {}, {}>, res, next) => {
  const { params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.getByRobotId(params.robotId);
    if (!organization.isUserAllowed(userId, [OrganizationPermissions.Admin, OrganizationPermissions.Analyst, OrganizationPermissions.Operator, OrganizationPermissions.Owner])) {
      throw new Forbidden('User do not have the authorization for creating a new part');
    };

    const robot = await Robot.findOne({ _id: params.robotId });
    if (!robot) { throw new BadRequest('The robot could not be found'); };

    robot.parts = robot.parts.filter(e => e._id.toString() !== params.partId);
    await robot.save();
    res.send({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  deleteRobotPart,
  { validation: { params: deletePartSchemaParams } }
), { role: UserRole.Verified });
