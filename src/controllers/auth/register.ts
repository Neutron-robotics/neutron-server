import { randomUUID } from 'crypto';
import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import User from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';

export const registerSchema = Joi.object().keys({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  password: Joi.string().required(),
  email: Joi.string().required().email()
});

interface RegisterBody {
    firstName: string,
    lastName: string,
    password: string,
    email: string
}

const register: RequestHandler = async (req: Request<{}, {}, RegisterBody>, res, next) => {
  console.log('Toto');
  const { body } = req;
  try {
    const activationKey = randomUUID();
    const user = new User({
      ...body,
      active: true,
      activationKey
    });
    await user.save();
    res.send({
      message: 'OK'
    });
  } catch (error: any) {
    next(User.checkDuplicateEmailError(error));
  }
};

export default requestMiddleware(register, { validation: { body: registerSchema } });
