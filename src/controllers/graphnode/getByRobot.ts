import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import NeutronGraph, { INeutronNode } from '../../models/NeutronGraph';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import { UserRole } from '../../models/User';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import { BadRequest, Forbidden } from '../../errors/bad-request';

const getByRobotParamsSchema = Joi.object().keys({
  robotId: Joi.string().required()
});

const getByRobotQuerySchema = Joi.object().keys({
  type: Joi.string().valid('Flow', 'Connector').optional()
});

interface GetByRobotParamsSchema {
    robotId: string,
}

interface GetByRobotQuerySchema {
    type?: 'Flow' | 'Connector'
}

const getByRobot: RequestHandler<any> = async (req: Request<GetByRobotParamsSchema, {}, {}, GetByRobotQuerySchema>, res, next) => {
  const { params, query } = req;
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.getByRobotId(params.robotId);
    if (!organization) {
      throw new BadRequest('The organization does not exist');
    }
    if (!organization.isUserAllowed(userId, [OrganizationPermissions.Owner, OrganizationPermissions.Admin, OrganizationPermissions.Analyst, OrganizationPermissions.Operator])) {
      throw new Forbidden('User do not have the authorization for nodes settings');
    }

    const graphs = query.type ? await NeutronGraph.find({ robot: params.robotId, type: query.type }).lean()
      : await NeutronGraph.find({ robot: params.robotId }).lean();

    res.send({
      message: 'OK',
      graphs
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(
  requestMiddleware(
    getByRobot,
    { validation: { params: getByRobotParamsSchema, query: getByRobotQuerySchema } }
  ),
  { role: UserRole.Verified }
);
