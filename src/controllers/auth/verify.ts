/* eslint-disable consistent-return */
import { RequestHandler, Request } from 'express';
import Joi from 'joi';
import User from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';

export const verifyQuery = Joi.object().keys({
  key: Joi.string().required().min(4)
});

interface VerifyQuery {
    key: string,
}

const verify: RequestHandler = async (req: Request<{}, {}, VerifyQuery>, res, next) => {
  try {
    await User.findOneAndUpdate(
      { activationKey: req.query.key },
      { active: true }
    );
    return res.json({ message: 'OK' });
  } catch (error) {
    next(error);
  }
};

export default requestMiddleware(verify, { validation: { query: verifyQuery } });
