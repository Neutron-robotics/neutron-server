import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import User, { UserRole } from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import Organization from '../../models/Organization';
import { Forbidden, NotFound } from '../../errors/bad-request';

const promoteSchemaBody = Joi.object().keys({
  role: Joi.string().required(),
  user: Joi.string().required().email()
});

const promoteSchemaParams = Joi.object().keys({
  organization: Joi.string().required()
});

interface PromoteParams {
  organization: string
}

interface PromoteBody {
    role: string
    user: string
}

const promote: RequestHandler<any> = async (
  req: Request<PromoteParams, {}, PromoteBody>,
  res,
  next
) => {
  const { body, params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.findOne({ name: params.organization }).exec();
    if (!organization) { throw new NotFound(); };

    const userRelationAuthor = organization.users.find(e => e.userId.toString() === userId);

    if (!userRelationAuthor) { throw new Forbidden(); };
    // Only owner can transfer the ownership
    if (!userRelationAuthor.permissions.includes('owner') && body.role === 'owner') { throw new Forbidden(); };
    // only these users can promote
    if (!userRelationAuthor.permissions.includes('owner') && !userRelationAuthor.permissions.includes('admin')) { throw new Forbidden(); };

    // find the user on which the operation will apply
    const userToBeGranted = await User.findOne({ email: body.user.toLowerCase() }).exec();
    if (!userToBeGranted) throw new NotFound(`Cannot find user associated with the email ${body.user}`);

    const userToBeGrantedRelation = organization.users
      .find(e => e.userId === userToBeGranted._id);

    if (!userToBeGrantedRelation) {
      // If the user does not belong to the organization yet, we add itF
      organization.users.push({
        userId: userToBeGranted._id,
        permissions: [body.role]
      });
    } else if (!userToBeGrantedRelation.permissions.includes(body.role)) {
      // otherwise we add the role if he does not already have it
      userToBeGrantedRelation.permissions.push(body.role);
    }

    // In case of transfer of ownership we remove the role for the previous owner
    // and we replace it by the admin role
    if (body.role === 'owner') {
      userRelationAuthor.permissions = userRelationAuthor.permissions.filter(e => e !== 'owner');
      userRelationAuthor.permissions.push('admin');
    };

    await organization.save();
    return res.json({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  promote,
  { validation: { body: promoteSchemaBody, params: promoteSchemaParams } }
), { roles: [UserRole.Verified] });
