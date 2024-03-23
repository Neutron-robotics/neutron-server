import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import { NotFound } from '../../errors/bad-request';
import User, { UserRole } from '../../models/User';

const updateSchemaBody = Joi.object().keys({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  email: Joi.string().optional(),
  active: Joi.boolean().optional(),
  roles: Joi.array().optional()
});

const updateSchemaParams = Joi.object().keys({
  userId: Joi.string().required()
});

interface UpdateBody {
  firstName: string | undefined
  lastName: string | undefined
  email: string | undefined
  active: boolean | undefined
  roles: string[] | undefined
}

interface UpdateParams {
  userId: string
}

const update: RequestHandler<any> = async (
  req: Request<UpdateParams, {}, UpdateBody>,
  res,
  next
) => {
  const { body, params } = req;

  try {
    const user = await User.findById(params.userId).exec();
    if (!user) { throw new NotFound(); };

    if (body.firstName) { user.firstName = body.firstName; }
    if (body.lastName) { user.lastName = body.lastName; }
    if (body.email) { user.email = body.email; }
    if (body.active !== undefined) { user.active = body.active; }
    if (body.roles) { user.roles = body.roles; }
    await user.save();

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
), { roles: [UserRole.Admin] });
