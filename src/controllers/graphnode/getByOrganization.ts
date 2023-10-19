import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import NeutronGraph, { INeutronNode } from '../../models/NeutronGraph';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import { UserRole } from '../../models/User';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import { BadRequest, Forbidden } from '../../errors/bad-request';
import Robot from '../../models/Robot';

const getByOrganizationSchema = Joi.object().keys({
  organizationId: Joi.string().required()
});

interface GetByOrganizationParams {
    organizationId: string,
}

const getByOrganization: RequestHandler<any> = async (req: Request<GetByOrganizationParams, {}, {}>, res, next) => {
  const { params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.getByRobotId(params.organizationId);
    if (!organization.isUserAllowed(userId, [OrganizationPermissions.Admin, OrganizationPermissions.Analyst, OrganizationPermissions.Operator])) {
      throw new Forbidden('User do not have the authorization for nodes settings');
    }

    const graphs = await NeutronGraph.find({ robotId: { $in: organization.robots } }).lean();

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
    getByOrganization,
    { validation: { body: getByOrganizationSchema } }
  ),
  { roles: [UserRole.Verified] }
);
