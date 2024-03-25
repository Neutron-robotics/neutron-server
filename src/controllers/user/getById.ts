import { Request, RequestHandler } from 'express';
import Joi from 'joi';
import User, { UserRole } from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import { BadRequest } from '../../errors/bad-request';

const getUserSchemaParams = Joi.object().keys({
  userId: Joi.string().required()
});

interface GetUserParams {
  userId: string
}

const getUserById: RequestHandler<any> = async (req: Request<GetUserParams, {}, {}>, res, next) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) throw new BadRequest('User not found');

    return res.json({
      message: 'OK',
      user: user?.toDTOModel()
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(
  requestMiddleware(
    getUserById,
    { validation: { params: getUserSchemaParams } }
  ),
  { role: UserRole.Verified }
);
