import { Request, RequestHandler } from 'express';
import Joi from 'joi';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import Organization from '../../models/Organization';

const createSchema = Joi.object().keys({
  name: Joi.string().required(),
  company: Joi.string().required(),
  description: Joi.string().required(),
  imgUrl: Joi.string().required()
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
        permissions: ['owner']
      }]
    });
    await organization.save();
  } catch (error: any) {
    next(Organization.checkDuplicateNameError(error));
  }
};

export default withAuth(requestMiddleware(create, { validation: { body: createSchema } }), { roles: ['verified'] });
