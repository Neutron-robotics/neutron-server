import { RequestHandler, Request } from 'express';
import Joi from 'joi';
import User, { UserRole } from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { BadRequest, Unauthorized } from '../../errors/bad-request';
import { createElasticUser } from '../../api/elasticsearch/users';

export const verifyQuery = Joi.object().keys({
  key: Joi.string().required().min(4)
});

interface VerifyQuery {
    key: string,
}

const verify: RequestHandler = async (req: Request<{}, {}, VerifyQuery>, res, next) => {
  try {
    const user = await User.findOne({ activationKey: req.query.key });

    if (!user) {
      throw new Unauthorized();
    }

    const elasticUsername = await user.toElasticUsername();
    await createElasticUser({
      username: elasticUsername,
      password_hash: user.password,
      email: user.email,
      roles: []
    });

    user.elasticUsername = elasticUsername;
    user.role = UserRole.Verified;
    user.activationKey = undefined;
    await user.save();

    return res.json({ message: 'OK' });
  } catch (error) {
    next(error);
  }
};

export default requestMiddleware(verify, { validation: { query: verifyQuery } });
