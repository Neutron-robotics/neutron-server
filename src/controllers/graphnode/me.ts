import { Request, RequestHandler } from 'express';
import NeutronGraph, { INeutronNode } from '../../models/NeutronGraph';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import { UserRole } from '../../models/User';

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
  { role: UserRole.Verified }
);
