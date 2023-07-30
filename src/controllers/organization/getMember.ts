import { Request, RequestHandler } from 'express';
import Joi from 'joi';
import { withAuth } from '../../middleware/withAuth';
import requestMiddleware from '../../middleware/request-middleware';
import { NotFound } from '../../errors/bad-request';
import Organization from '../../models/Organization';
import User, { UserRole } from '../../models/User';

const getMemberSchemaParams = Joi.object().keys({
  id: Joi.string().required(),
  organization: Joi.string().required()
});

interface GetMemberParams {
    id: string,
    organization: string
}

const getMember: RequestHandler<any> = async (
  req: Request<GetMemberParams, {}, {}>,
  res,
  next
) => {
  const { params } = req;
  const userId = (req as any).user.sub as string;

  const organization = await Organization.findOne({ name: params.organization }).exec();
  if (!organization) { throw new NotFound(); };

  try {
    const user = await User.findOne({ _id: userId }).exec();
    if (!user) {
      next(new NotFound('User not found'));
    }
    const userDto = {
      id: user?._id,
      email: user?.email,
      firstName: user?.firstName,
      lastName: user?.lastName,
      imgUrl: user?.imgUrl
    };

    return res.json({
      message: 'OK',
      user: userDto
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  getMember,
  { validation: { params: getMemberSchemaParams } }
), { roles: [UserRole.Verified] });
