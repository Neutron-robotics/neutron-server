import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import User, { UserRole } from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import { BadRequest, Forbidden, NotFound } from '../../errors/bad-request';
import { addRolesToUser, removeRolesFromUser } from '../../utils/elasticsearch';

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
    role: OrganizationPermissions
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

    // verify if the client is an administrator of the platform
    const user = await User.findById(userId);
    const isUserAdmin = user?.role === UserRole.Admin;

    const userRelationAuthor = organization.users.find(e => e.userId.toString() === userId);

    if (!userRelationAuthor && !isUserAdmin) { throw new Forbidden(); };
    // Only owner can transfer the ownership
    if (!userRelationAuthor?.permissions.includes(OrganizationPermissions.Owner) && body.role === OrganizationPermissions.Owner && !isUserAdmin) { throw new Forbidden(); };
    // only these users can promote
    if (!userRelationAuthor?.permissions.includes(OrganizationPermissions.Owner) && !userRelationAuthor?.permissions.includes(OrganizationPermissions.Admin) && !isUserAdmin) { throw new Forbidden(); };

    // find the user on which the operation will apply
    const userToBeGranted = await User.findOne({ email: body.user.toLowerCase() }).exec();
    if (!userToBeGranted) throw new NotFound(`Cannot find user associated with the email ${body.user}`);

    const userToBeGrantedRelation = organization.users
      .find(e => e.userId.toString() === userToBeGranted._id.toString());

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
    if (body.role === OrganizationPermissions.Owner) {
      if (!userRelationAuthor) {
        const organizationOwner = organization.users.find(e => e.permissions.includes(OrganizationPermissions.Owner));
        if (organizationOwner) {
          organizationOwner.permissions = organizationOwner.permissions.filter(e => e !== OrganizationPermissions.Owner);
        }
      } else {
        userRelationAuthor.permissions = userRelationAuthor.permissions.filter(e => e !== OrganizationPermissions.Owner);
        userRelationAuthor.permissions.push(OrganizationPermissions.Admin);
      }
    };

    // Manage Elasticsearch permissions for the promoted user
    if ([OrganizationPermissions.Admin,
      OrganizationPermissions.Analyst,
      OrganizationPermissions.Owner].some(e => userToBeGrantedRelation?.permissions.includes(e))) {
      addRolesToUser(userToBeGranted.toElasticUsername(), [`organization-${organization.name}`]);
    } else {
      removeRolesFromUser(userToBeGranted.toElasticUsername(), [`organization-${organization.name}`]);
    }

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
), { role: UserRole.Verified });
