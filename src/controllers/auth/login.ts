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
    const payload = { sub: user._id, role: user.role };
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
