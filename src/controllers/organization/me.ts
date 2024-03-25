import { Request, RequestHandler } from 'express';
import User, { UserRole } from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import { NotFound } from '../../errors/bad-request';
import Organization from '../../models/Organization';

const me: RequestHandler = async (req: Request<{}, {}, {}>, res, next) => {
  try {
    const userId = (req as any).user.sub as string;
    const user = await User.findOne({ _id: userId }).exec();
    if (!user) {
      throw new NotFound();
    }

    const organizations = (await Organization
      .find({ users: { $elemMatch: { userId, permissions: 'owner' } }, active: true })
      .lean()
      .exec())
      .map(({ active, ...rest }) => rest);

    return res.json({
      message: 'OK',
      organizations
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(me), { role: UserRole.Verified });
