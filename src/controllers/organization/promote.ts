import { randomUUID } from 'crypto';
import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import User from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import Organization from '../../models/Organization';
import { BadRequest, Forbidden, NotFound } from '../../errors/bad-request';

const promoteSchemaBody = Joi.object().keys({
  role: Joi.string().required(),
  user: Joi.string().required()
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

    // verify if the user is owner of the organization
    if (!organization.users.find(e => e.userId === userId && e.permissions.includes('owner'))) { throw new Forbidden(); };

    // find the user on which the operation will apply
    const userToBeGranted = await User.findOne({ email: body.user }).exec();
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

    await organization.save();
    res.send({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  promote,
  { validation: { body: promoteSchemaBody, params: promoteSchemaParams } }
), { roles: ['verified'] });
