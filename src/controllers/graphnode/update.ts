import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { NeutronGraphType } from '@hugoperier/neutron-core';
import NeutronGraph, { INeutronEdge, INeutronNode } from '../../models/NeutronGraph';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import { UserRole } from '../../models/User';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import { BadRequest, Forbidden } from '../../errors/bad-request';
import Robot from '../../models/Robot';
import RobotPart from '../../models/RobotPart';

const updateSchema = Joi.object().keys({
  title: Joi.string().optional(),
  type: Joi.string().optional(),
  nodes: Joi.array().optional(),
  edges: Joi.array().optional(),
  imgUrl: Joi.string().optional(),
  robotId: Joi.string().optional(),
  partId: Joi.string().optional()
});

const updateParams = Joi.object().keys({
  graphId: Joi.string().required()
});

interface UpdateBody {
    title?: string,
    type?: NeutronGraphType,
    nodes?: INeutronNode[]
    edges?: INeutronEdge[]
    partId?: string
    robotId?: string
    imgUrl?: string
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
    if (!organization.isUserAllowed(userId, [OrganizationPermissions.Owner, OrganizationPermissions.Admin, OrganizationPermissions.Analyst, OrganizationPermissions.Operator])) {
      throw new Forbidden('User do not have the authorization for nodes settings');
    }

    if (body.title) { graph.title = body.title; }
    if (body.type) { graph.type = body.type; }
    if (body.nodes) { graph.nodes = body.nodes; }
    if (body.edges) { graph.edges = body.edges; }
    if (body.imgUrl) { graph.imgUrl = body.imgUrl; }
    if (body.robotId) {
      const robot = await Robot.findById(body.robotId);
      if (!robot) throw new BadRequest('The robot does not exist');
      graph.robot = robot._id;
    }
    if (body.partId) {
      const robot = await Robot.findById(body.robotId ?? graph.robot);
      if (!robot) throw new BadRequest('The robot does not exist');
      const part = robot.parts.find(e => e._id.toString() === body.partId);
      if (!part) throw new BadRequest('The robot part does not exist');
      graph.part = part._id;
    }

    graph.modifiedBy = new mongoose.Types.ObjectId(userId);

    await graph.save();

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
