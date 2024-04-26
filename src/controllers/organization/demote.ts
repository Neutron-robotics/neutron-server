import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import User, { UserRole } from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import Organization from '../../models/Organization';
import { BadRequest, Forbidden, NotFound } from '../../errors/bad-request';
import { removeRolesFromUser } from '../../utils/elasticsearch';

const demoteSchemaBody = Joi.object().keys({
  user: Joi.string().required()
});

const demoteSchemaQuery = Joi.object().keys({
  organization: Joi.string().required()
});

interface DemoteBody {
    user: string
}

interface DemoteParams {
  organization: string
}

const demote: RequestHandler<any> = async (
  req: Request<DemoteParams, {}, DemoteBody>,
  res,
  next
) => {
  const { body, params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.findOne({ name: params.organization }).exec();
    if (!organization) { throw new NotFound(); };

    const user = await User.findById(userId);
    const isUserAdmin = user?.role === UserRole.Admin;

    if (!user) throw new BadRequest('User not found');

    // verify if the user is owner of the organization or an administrator of the platform
    if (!organization.isUserAdmin(userId) && !isUserAdmin) { throw new Forbidden(); };

    // find the user on which the operation will apply
    const userToBeDemoted = await User.findOne({ email: body.user }).exec();
    if (!userToBeDemoted) throw new NotFound(`Cannot find user associated with the email ${body.user}`);

    organization.users = organization.users.filter(e => e.userId.toString() !== userToBeDemoted._id.toString());

    // Manage Elasticsearch permissions for the promoted user
    removeRolesFromUser(user.toElasticUsername(), [`organization-${organization.name}`]);

    await organization.save();
    return res.json({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  demote,
  { validation: { body: demoteSchemaBody, params: demoteSchemaQuery } }
), { role: UserRole.Verified });
