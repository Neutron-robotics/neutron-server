import { Request, RequestHandler } from 'express';
import Joi from 'joi';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import User, { UserRole } from '../../models/User';
import { addRolesToUser, createOrganizationRole } from '../../utils/elasticsearch';
import logger from '../../logger';

const createSchema = Joi.object().keys({
  name: Joi.string().required(),
  company: Joi.string().required(),
  description: Joi.string().required(),
  imgUrl: Joi.string().optional()
});

interface CreateBody {
    name: string,
    company: string,
    description: string,
    imgUrl: string
}

const create: RequestHandler = async (req: Request<{}, {}, CreateBody>, res, next) => {
  const { body } = req;

  try {
    const userId = (req as any).user.sub as string;
    const organization = new Organization({
      ...body,
      users: [{
        userId,
        permissions: [OrganizationPermissions.Owner]
      }]
    });
    await organization.save();

    createOrganizationRole(organization.name).then(async () => {
      const owner = await User.findById(userId);
      if (!owner) {
        logger.error(`Failed creating ES ${organization.name} role, aborting user role definition`);
        return;
      }

      addRolesToUser(owner.toElasticUsername(), [organization.toElasticIndexName()]);
    });

    return res.json({
      message: 'OK'
    });
  } catch (error: any) {
    next(Organization.checkDuplicateError(error));
  }
};

export default withAuth(requestMiddleware(create, { validation: { body: createSchema } }), { role: UserRole.Verified });
