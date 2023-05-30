/* eslint-disable consistent-return */
/* eslint-disable import/no-extraneous-dependencies */
import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import { sign } from 'jsonwebtoken';
import User from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';

export const deleteSchema = Joi.object().keys({
  id: Joi.string().required()
});

interface DeleteBody {
    id: string,
}

const deleteUser: RequestHandler = async (req: Request<{}, {}, DeleteBody>, res, next) => {
  const { body } = req;
  try {
    await User.deleteOne({ _id: body.id }).exec();
    return res.json({ message: 'OK' });
  } catch (error) {
    next(error);
  }
};

export default withAuth(requestMiddleware(deleteUser, { validation: { body: deleteSchema } }), { roles: ['admin'] });
