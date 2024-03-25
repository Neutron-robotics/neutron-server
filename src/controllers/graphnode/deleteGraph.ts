import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import NeutronGraph, { INeutronNode } from '../../models/NeutronGraph';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import { UserRole } from '../../models/User';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import { BadRequest, Forbidden } from '../../errors/bad-request';
import Robot from '../../models/Robot';

const deleteSchema = Joi.object().keys({
  graphId: Joi.string().required()
});

interface DeleteGraphParams {
    graphId: string,
}

const deleteGraph: RequestHandler<any> = async (req: Request<DeleteGraphParams, {}, {}>, res, next) => {
  const { params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const graph = await NeutronGraph.findById(params.graphId);
    if (!graph) throw new BadRequest('The graph has not been found');
    const organization = await Organization.getByRobotId(graph.robot._id.toString());
    if (!organization.isUserAllowed(userId, [OrganizationPermissions.Owner, OrganizationPermissions.Admin, OrganizationPermissions.Analyst, OrganizationPermissions.Operator])) {
      throw new Forbidden('User do not have the authorization for nodes settings');
    }

    await NeutronGraph.deleteOne({ _id: graph._id });
    res.send({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(
  requestMiddleware(
    deleteGraph,
    { validation: { params: deleteSchema } }
  ),
  { role: UserRole.Verified }
);
