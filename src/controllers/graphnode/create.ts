import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import NeutronGraph, { INeutronNode } from '../../models/NeutronGraph';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import { UserRole } from '../../models/User';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import { BadRequest, Forbidden } from '../../errors/bad-request';
import Robot from '../../models/Robot';

const createSchema = Joi.object().keys({
  title: Joi.string().required(),
  robotId: Joi.string().required(),
  partId: Joi.string().required(),
  nodes: Joi.array().required()
});

interface CreateBody {
    title: string,
    robotId: string,
    partId: string,
    nodes: INeutronNode[]
}

const create: RequestHandler = async (req: Request<{}, {}, CreateBody>, res, next) => {
  const { body } = req;
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.getByRobotId(body.robotId);
    if (!organization.isUserAllowed(userId, [OrganizationPermissions.Admin, OrganizationPermissions.Analyst, OrganizationPermissions.Operator])) {
      throw new Forbidden('User do not have the authorization for nodes settings');
    }
    const robot = await Robot.findById(body.robotId);
    if (!robot) { throw new BadRequest('The robot does not exist'); }
    const part = robot.parts.find(e => e._id.toString() === body.partId);
    if (!part) { throw new BadRequest('The part does not exist'); };

    const graph = await NeutronGraph.create({
      title: body.title,
      robot: robot._id,
      part: part._id,
      createdBy: userId,
      modifiedBy: userId,
      nodes: body.nodes
    });

    res.send({
      message: 'OK',
      id: graph._id
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(
  requestMiddleware(
    create,
    { validation: { body: createSchema } }
  ),
  { roles: [UserRole.Verified] }
);
