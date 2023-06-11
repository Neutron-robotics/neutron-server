import { randomUUID } from 'crypto';
import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import User from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { BadRequest, NotFound } from '../../errors/bad-request';

export const resetSchema = Joi.object().keys({
  email: Joi.string().required().email()
});

interface ResetBody {
    email: string
}

const reset: RequestHandler = async (req: Request<{}, {}, ResetBody>, res, next) => {
  const { body } = req;
  try {
    const newPassword = randomUUID();
    const user = await User.findOne({ email: body.email }).exec();
    if (!user) {
      next(new NotFound());
      return;
    }
    user.password = newPassword;
    await user.save();

    return res.json({
      message: 'OK'
    });
  } catch (error: any) {
    next(new BadRequest());
  }
};

export default requestMiddleware(reset, { validation: { body: resetSchema } });
