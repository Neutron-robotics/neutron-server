/* eslint-disable consistent-return */
/* eslint-disable import/no-extraneous-dependencies */
import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import { sign } from 'jsonwebtoken';
import User from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';

export const loginSchema = Joi.object().keys({
  email: Joi.string().required(),
  password: Joi.string().required()
});

interface LoginBody {
    email: string,
    password: string
}

const login: RequestHandler = async (req: Request<{}, {}, LoginBody>, res, next) => {
  const { body } = req;
  try {
    const user = await User.findAndGenerateToken(body);
    const payload = { sub: user._id, roles: user.roles };
    const token = sign(payload, process.env.APP_SECRET ?? '', { expiresIn: '1d' });
    res.cookie('jwt', token, {
      httpOnly: true, secure: true, maxAge: 24 * 60 * 60 * 1000
    });
    return res.json({ message: 'OK', token });
  } catch (error) {
    next(error);
  }
};

export default requestMiddleware(login, { validation: { body: loginSchema } });
