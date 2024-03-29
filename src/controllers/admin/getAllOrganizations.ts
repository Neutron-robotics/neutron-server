import { Request, RequestHandler } from 'express';
import User, { UserRole } from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import Organization from '../../models/Organization';

const getAllOrganizations: RequestHandler = async (req: Request<{}, {}, {}>, res, next) => {
  try {
    const allOrganizations = await Organization.find().exec();

    const allOrganizationsFormatted = allOrganizations.map(organization => organization.toJSON());

    return res.json({
      message: 'OK',
      organizations: allOrganizationsFormatted
    });
  } catch (error) {
    next(error);
  }
};

export default withAuth(requestMiddleware(getAllOrganizations), { role: UserRole.Admin });
