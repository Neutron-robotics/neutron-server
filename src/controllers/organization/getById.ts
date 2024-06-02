import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import { withAuth } from '../../middleware/withAuth';
import { UserRole } from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { Forbidden, NotFound } from '../../errors/bad-request';
import Organization from '../../models/Organization';
import Robot from '../../models/Robot';

interface GetOrganizationParams {
    organizationId: string
}

const getRobotSchemaParams = Joi.object<GetOrganizationParams>().keys({
  organizationId: Joi.string().required()
});

const getById: RequestHandler<any> = async (
  req: Request<GetOrganizationParams, {}, {}>,
  res,
  next
) => {
  const { params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.findById(params.organizationId).lean();

    if (!organization) throw new NotFound();

    if (!organization || !organization.users.find(e => e.userId.toString() === userId)) { throw new Forbidden(); };

    return res.json({
      message: 'OK',
      organization
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  getById,
  { validation: { params: getRobotSchemaParams } }
), { role: UserRole.Verified });
