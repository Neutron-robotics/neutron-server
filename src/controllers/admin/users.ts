/* eslint-disable consistent-return */
import { Request, RequestHandler } from 'express';
import User from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';

const users: RequestHandler = async (req: Request<{}, {}, {}>, res, next) => {
  try {
    const allUsers = await User.find().exec();
    return res.json({
      message: 'OK',
      users: allUsers
    });
  } catch (error) {
    next(error);
  }
};

export default withAuth(requestMiddleware(users), { roles: ['admin'] });
