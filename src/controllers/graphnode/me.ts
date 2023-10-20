import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import NeutronGraph, { INeutronNode } from '../../models/NeutronGraph';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import { UserRole } from '../../models/User';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import { BadRequest, Forbidden } from '../../errors/bad-request';
import Robot from '../../models/Robot';

const getByOrganization: RequestHandler = async (req: Request<{}, {}, {}>, res, next) => {
  const userId = (req as any).user.sub as string;

  try {
    const graphs = await NeutronGraph.find({
      $or: [
        { createdBy: userId },
        { modifiedBy: userId }
      ]
    }).lean();

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
  ),
  { roles: [UserRole.Verified] }
);
