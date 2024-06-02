import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import User, { UserRole } from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import { NotFound } from '../../errors/bad-request';

export const deleteSchema = Joi.object().keys({
  id: Joi.string().required()
});

interface DeleteBody {
    id: string,
}

const deleteUser: RequestHandler = async (req: Request<{}, {}, DeleteBody>, res, next) => {
  const { body } = req;
  const user = await User.findOne({ _id: body.id }).exec();

  if (!user) {
    throw new NotFound();
  }

  user.active = false;
  try {
    await user.save();
    return res.json({ message: 'OK' });
  } catch (error) {
    next(error);
  }
};

export default withAuth(requestMiddleware(deleteUser, { validation: { body: deleteSchema } }), { role: UserRole.Admin });
