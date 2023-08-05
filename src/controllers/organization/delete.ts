import { Request, RequestHandler } from 'express';
import Joi from 'joi';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import Organization from '../../models/Organization';
import { Forbidden, NotFound } from '../../errors/bad-request';
import { UserRole } from '../../models/User';

const deleteSchemaQuery = Joi.object().keys({
  organization: Joi.string().required()
});

interface DeleteQuery {
    organization: string,
}

const deleteOrganization: RequestHandler<any> = async (req: Request<DeleteQuery>, res, next) => {
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.findOne({ name: req.params.organization }).exec();
    if (!organization) { throw (new NotFound('organization not found')); };
    if (!organization.isUserAdmin(userId)) {
      throw new Forbidden();
    }
    organization.active = false;
    await organization.save();
    return res.json({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(deleteOrganization, { validation: { params: deleteSchemaQuery } }), { roles: [UserRole.Verified] });
