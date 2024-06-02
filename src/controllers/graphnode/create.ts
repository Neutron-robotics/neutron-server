import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import { NeutronGraphType } from '@neutron-robotics/neutron-core';
import NeutronGraph, { INeutronEdge, INeutronNode } from '../../models/NeutronGraph';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import { UserRole } from '../../models/User';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import { BadRequest, Forbidden } from '../../errors/bad-request';
import Robot from '../../models/Robot';

const createSchema = Joi.object().keys({
  title: Joi.string().required(),
  type: Joi.string().required(),
  robotId: Joi.string().required(),
  partId: Joi.string().optional(),
  nodes: Joi.array().required(),
  edges: Joi.array().required(),
  imgUrl: Joi.string().optional()
});

interface CreateBody {
    title: string,
    type: NeutronGraphType
    robotId: string,
    partId: string,
    nodes: INeutronNode[]
    edges: INeutronEdge[],
    imgUrl?: string
}

const create: RequestHandler = async (req: Request<{}, {}, CreateBody>, res, next) => {
  const { body } = req;
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.getByRobotId(body.robotId);
    if (!organization.isUserAllowed(userId, [OrganizationPermissions.Owner, OrganizationPermissions.Admin, OrganizationPermissions.Analyst, OrganizationPermissions.Operator])) {
      throw new Forbidden('User do not have the authorization for nodes settings');
    }
    const robot = await Robot.findById(body.robotId);
    if (!robot) { throw new BadRequest('The robot does not exist'); }

    if (body.partId) {
      const part = robot.parts.find(e => e._id.toString() === body.partId);
      if (!part) { throw new BadRequest('The part does not exist'); };
    }

    const graph = await NeutronGraph.create({
      title: body.title,
      type: body.type,
      robot: robot._id,
      part: body.partId,
      createdBy: userId,
      modifiedBy: userId,
      nodes: body.nodes,
      edges: body.edges,
      imgUrl: body.imgUrl
    });

    res.send({
      message: 'OK',
      id: graph.id
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
  { role: UserRole.Verified }
);
