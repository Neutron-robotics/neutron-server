import { Request, RequestHandler } from 'express';
import NeutronGraph, { INeutronNode } from '../../models/NeutronGraph';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import User, { UserRole } from '../../models/User';
import { BadRequest } from '../../errors/bad-request';
import Organization from '../../models/Organization';

const getAllGraphs: RequestHandler = async (req: Request<{}, {}, {}>, res, next) => {
  const userId = (req as any).user.sub as string;

  try {
    const user = await User.findOne({ _id: userId }).exec();
    if (!user) {
      throw new BadRequest('User not found');
    }

    const organizations = await Organization
      .find({ users: { $elemMatch: { userId } }, active: true });

    const robotIds = organizations.reduce<string[]>((acc, cur) => ([...acc, ...cur.robots]), []);

    const graphs = await NeutronGraph.find({ robot: { $in: robotIds } }).lean();

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
    getAllGraphs,
  ),
  { roles: [UserRole.Verified] }
);
