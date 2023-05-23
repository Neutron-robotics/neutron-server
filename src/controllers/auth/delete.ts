/* eslint-disable consistent-return */
/* eslint-disable import/no-extraneous-dependencies */
import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import { sign } from 'jsonwebtoken';
import User from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';

export const deleteSchema = Joi.object().keys({
  email: Joi.string().required()
});

interface DeleteBody {
    email: string,
}

const deleteUser: RequestHandler = async (req: Request<{}, {}, DeleteBody>, res, next) => {
  const { body } = req;
  try {
    const user = await User.findOne({
      email: body.email
    });
    console.log('found user', user);
    user?.deleteOne();
    // User.deleteOne({
    //   email: body.email
    // });
    await user?.save();
    return res.json({ message: 'OK' });
  } catch (error) {
    next(error);
  }
};

export default requestMiddleware(deleteUser, { validation: { body: deleteSchema } });
