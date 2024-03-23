import { Request, RequestHandler } from 'express';
import User, { UserRole } from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';

const users: RequestHandler = async (req: Request<{}, {}, {}>, res, next) => {
  try {
    const allUsers = await User.find().exec();

    const allUsersFormatted = allUsers.map(user => {
      const {
        _id, password, activationKey, ...rest
      } = user.toObject();
      return { id: _id, ...rest };
    });

    return res.json({
      message: 'OK',
      users: allUsersFormatted
    });
  } catch (error) {
    next(error);
  }
};

export default withAuth(requestMiddleware(users), { roles: [UserRole.Admin] });
