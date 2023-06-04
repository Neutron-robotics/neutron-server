/* eslint-disable consistent-return */
/* eslint-disable import/no-extraneous-dependencies */
import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import User from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import { Unauthorized } from '../../errors/bad-request';

export const deleteSchema = Joi.object().keys({
  email: Joi.string().required()
});

interface DeleteBody {
    email: string,
}

const deleteUser: RequestHandler = async (req: Request<{}, {}, DeleteBody>, res, next) => {
  const userId = (req as any).user.sub as string;
  const user = await User.findOne({ _id: userId }).exec();

  if (!user) {
    next(new Unauthorized());
    return;
  }
  const { body } = req;
  try {
    await User.deleteOne({ email: body.email }).exec();
    return res.json({ message: 'OK' });
  } catch (error) {
    next(error);
  }
};

export default withAuth(requestMiddleware(deleteUser, { validation: { body: deleteSchema } }));
