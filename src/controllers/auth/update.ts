/* eslint-disable consistent-return */
import { randomUUID } from 'crypto';
import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import User from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { BadRequest, NotFound, Unauthorized } from '../../errors/bad-request';
import { withAuth } from '../../middleware/withAuth';

export const updateSchema = Joi.object().keys({
  email: Joi.string(),
  firstName: Joi.string(),
  lastName: Joi.string(),
  password: Joi.string()
});

interface UpdateBody {
    [key: string]: string | undefined;
  }

const update: RequestHandler = async (req: Request<{}, {}, UpdateBody>, res, next) => {
  const { body } = req;
  try {
    const userId = (req as any).user.sub as string;
    const user = await User.findOne({ _id: userId }).exec();

    if (!user) {
      next(new Unauthorized());
      return;
    }

    Object.keys(body).forEach(key => {
      if (body[key] && (user as any)[key]) {
        (user as any)[key] = body[key] as string;
      }
    });

    if (body.email) { user.email = body.email; };
    if (body.firstName) { user.firstName = body.firstName; };
    if (body.lastName) { user.lastName = body.lastName; };
    if (body.password) { user.password = body.password; };
    await user.save();

    return res.json({
      message: 'OK'
    });
  } catch (error: any) {
    next(new BadRequest());
  }
};

export default withAuth(requestMiddleware(update, { validation: { body: updateSchema } }));
