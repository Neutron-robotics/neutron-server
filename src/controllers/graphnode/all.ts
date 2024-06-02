import { Request, RequestHandler } from 'express';
import Joi from 'joi';
import NeutronGraph, { INeutronNode } from '../../models/NeutronGraph';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import User, { UserRole } from '../../models/User';
import { BadRequest } from '../../errors/bad-request';
import Organization from '../../models/Organization';

const getAllGraphsQueryParams = Joi.object().keys({
  includeRobot: Joi.string().optional(),
  includeOrganization: Joi.string().optional()
});

interface GetAllGraphQueryParams {
  includeRobot?: string
  includeOrganization?: string
}

const getAllGraphs: RequestHandler = async (req: Request<{}, {}, {}, GetAllGraphQueryParams>, res, next) => {
  const userId = (req as any).user.sub as string;
  const { query } = req;

  try {
    const user = await User.findOne({ _id: userId }).exec();
    if (!user) {
      throw new BadRequest('User not found');
    }

    const organizations = await Organization
      .find({ users: { $elemMatch: { userId } }, active: true });

    const robotIds = organizations.reduce<string[]>((acc, cur) => ([...acc, ...cur.robots]), []);

    const graphsQuery = NeutronGraph.find({ robot: { $in: robotIds } });

    if (query.includeRobot === 'true') {
      graphsQuery.populate({
        path: 'robot',
        select: '_id name imgUrl'
      });
    }

    const graphs = await graphsQuery.lean().exec();

    if (query.includeOrganization === 'true') {
      const graphsWithOrganization = graphs.map(e => {
        const graphOrganization = organizations.find(org => org.robots.includes(e.robot._id as unknown as string));
        return {
          ...e,
          organization: {
            id: graphOrganization?.id,
            name: graphOrganization?.name,
            imgUrl: graphOrganization?.imgUrl
          }
        };
      });
      res.send({
        message: 'OK',
        graphs: graphsWithOrganization
      });
    } else {
      res.send({
        message: 'OK',
        graphs
      });
    }
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(
  requestMiddleware(
    getAllGraphs,
    {
      validation: {
        query: getAllGraphsQueryParams
      }
    }
  ),
  { role: UserRole.Verified }
);
