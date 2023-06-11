import { Request, RequestHandler } from 'express';
import User from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import { Unauthorized } from '../../errors/bad-request';

const deleteUser: RequestHandler = async (req: Request<{}, {}, {}>, res, next) => {
  const userId = (req as any).user.sub as string;

  try {
    const result = await User.findOneAndUpdate(
      { _id: userId },
      { $set: { active: false } }
    ).exec();
    if (!result) {
      next(new Unauthorized());
    }
    return res.json({ message: 'OK' });
  } catch (error) {
    next(error);
  }
};

export default withAuth(requestMiddleware(deleteUser));
