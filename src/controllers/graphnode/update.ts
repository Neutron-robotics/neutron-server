import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import mongoose from 'mongoose';
import NeutronGraph, { INeutronNode } from '../../models/NeutronGraph';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import { UserRole } from '../../models/User';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import { BadRequest, Forbidden } from '../../errors/bad-request';

const updateSchema = Joi.object().keys({
  title: Joi.string().optional(),
  nodes: Joi.array().optional()
});

const updateParams = Joi.object().keys({
  graphId: Joi.string().required()
});

interface UpdateBody {
    title?: string,
    nodes?: INeutronNode[]
}

interface UpdateParams {
    graphId: string,
}

const update: RequestHandler<any> = async (req: Request<UpdateParams, {}, UpdateBody>, res, next) => {
  const { body, params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const graph = await NeutronGraph.findById(params.graphId);
    if (!graph) {
      throw new BadRequest('This graph does not exist');
    }

    const organization = await Organization.getByRobotId(graph.robot.toString());
    if (!organization.isUserAllowed(userId, [OrganizationPermissions.Admin, OrganizationPermissions.Analyst, OrganizationPermissions.Operator])) {
      throw new Forbidden('User do not have the authorization for nodes settings');
    }

    if (body.title) { graph.title = body.title; }
    if (body.nodes) { graph.nodes = body.nodes; }
    graph.modifiedBy = new mongoose.Types.ObjectId(userId);

    res.send({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(
  requestMiddleware(
    update,
    { validation: { body: updateSchema, params: updateParams } }
  ),
  { roles: [UserRole.Verified] }
);
