import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import Organization from '../../models/Organization';
import { Forbidden, NotFound } from '../../errors/bad-request';
import { UserRole } from '../../models/User';

const updateSchemaBody = Joi.object().keys({
  name: Joi.string().optional(),
  company: Joi.string().optional(),
  description: Joi.string().optional(),
  imgUrl: Joi.string().optional()
});

const updateSchemaParams = Joi.object().keys({
  organization: Joi.string().required()
});

interface UpdateBody {
    name: string | undefined,
    company: string | undefined,
    description: string | undefined,
    imgUrl: string | undefined
}

interface DemoteParams {
  organization: string
}

const update: RequestHandler<any> = async (
  req: Request<DemoteParams, {}, UpdateBody>,
  res,
  next
) => {
  const { body, params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.findOne({ name: params.organization }).exec();
    if (!organization) { throw new NotFound(); };

    // verify if the user is owner of the organization
    if (!organization.isUserAdmin(userId)) { throw new Forbidden(); };

    // here update the organization details
    const updatedOrganization = await Organization.findOneAndUpdate(
      { name: params.organization },
      { $set: body },
      { new: true }
    ).exec();

    if (!updatedOrganization) {
      throw new Error('Failed to update organization');
    }

    return res.json({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  update,
  { validation: { body: updateSchemaBody, params: updateSchemaParams } }
), { role: UserRole.Verified });
