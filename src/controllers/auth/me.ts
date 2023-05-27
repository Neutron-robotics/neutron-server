import { randomUUID } from 'crypto';
import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import User, { IUser } from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';

const me: RequestHandler = async (req: Request<{}, {}, {}>, res, next) => {
  try {
    const userId = (req as any).user.sub as string;
    const user = await User.findOne({ _id: userId }).exec();
    const payload = { ...user?.toJSON() };
    delete payload.password;
    console.log(payload);
    res.send({
      me: payload
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(me));
