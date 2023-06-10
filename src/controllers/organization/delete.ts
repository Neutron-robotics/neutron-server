/* eslint-disable consistent-return */
/* eslint-disable max-len */
import { Request, RequestHandler } from 'express';
import Joi from 'joi';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import Organization from '../../models/Organization';
import User from '../../models/User';
import { NotFound, Unauthorized } from '../../errors/bad-request';

const deleteSchemaQuery = Joi.object().keys({
  organization: Joi.string().required()
});

interface DeleteQuery {
    organization: string,
}

const deleteOrganization: RequestHandler<any> = async (req: Request<DeleteQuery>, res, next) => {
  const userId = (req as any).user.sub as string;

  try {
    const user = await User.findOne({ id: userId }).exec();
    if (!user) { throw new Unauthorized(); };
    const organization = await Organization.findOne({ name: req.params.organization }).exec();
    if (!organization) { throw (new NotFound('organization not found')); };
    if (organization.users.find(e => (e.userId === userId && e.permissions.includes('owner'))) && !user.roles.includes('admin')) {
      throw new Unauthorized();
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

export default withAuth(requestMiddleware(deleteOrganization, { validation: { params: deleteSchemaQuery } }), { roles: ['verified'] });
