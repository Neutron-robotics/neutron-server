import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import { withAuth } from '../../middleware/withAuth';
import { UserRole } from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import Organization from '../../models/Organization';
import Connection from '../../models/Connection';

interface GetMyConnectionsQuery {
    status?: string
}

const getMyConnectionsSchemaQuery = Joi.object<GetMyConnectionsQuery>().keys({
  status: Joi.string().optional()
});

const getConnectionById: RequestHandler<any> = async (
  req: Request<{}, {}, {}, GetMyConnectionsQuery>,
  res,
  next
) => {
  const { query } = req;
  const userId = (req as any).user.sub as string;

  try {
    const myOrganizations = (await Organization
      .find({ users: { $elemMatch: { userId } }, active: true })
      .lean()
      .exec())
      .map(({ active, ...rest }) => rest);

    const robotsIds = myOrganizations.map(({ robots }) => robots).flat();

    const connections = await Connection.find({ robotId: { $in: robotsIds } });

    const connectionsDto = connections.map(e => e.toDTOModel()).filter(e => {
      if (query.status === 'active') return e.isActive;
      if (query.status === 'inactive') return !e.isActive;
      return true;
    });

    return res.json({
      message: 'OK',
      connections: connectionsDto
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  getConnectionById,
  { validation: { query: getMyConnectionsSchemaQuery } }
), { roles: [UserRole.Verified] });
