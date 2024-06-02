import { Request, RequestHandler } from 'express';
import Joi from 'joi';
import { withAuth } from '../../middleware/withAuth';
import requestMiddleware from '../../middleware/request-middleware';
import { NotFound } from '../../errors/bad-request';
import Organization from '../../models/Organization';
import User, { UserRole } from '../../models/User';

const getMemberSchemaParams = Joi.object().keys({
  organization: Joi.string().required()
});

const MemberSchemaQuery = Joi.object().keys({
  userId: Joi.string().optional(),
  email: Joi.string().optional()
});

interface GetMemberParams {
    organization: string
}

interface GetMemberQuery {
  userId?: string;
  email?: string
}

const getMember: RequestHandler<any> = async (
  req: Request<GetMemberParams, GetMemberQuery, {}>,
  res,
  next
) => {
  const { params, query } = req;
  const organization = await Organization.findOne({ name: params.organization }).exec();
  if (!organization) { throw new NotFound(); };

  try {
    const filter: any = {};
    if (query.userId) filter._id = query.userId;
    if (query.email) filter.email = query.email;
    const user = await User.findOne(filter).exec();
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
  { validation: { params: getMemberSchemaParams, query: MemberSchemaQuery } }
), { role: UserRole.Verified });
