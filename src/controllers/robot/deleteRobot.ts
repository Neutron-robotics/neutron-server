import { RequestHandler, Request } from 'express';
import Joi from 'joi';
import { withAuth } from '../../middleware/withAuth';
import requestMiddleware from '../../middleware/request-middleware';
import Robot from '../../models/Robot';
import Organization from '../../models/Organization';
import { BadRequest, Forbidden } from '../../errors/bad-request';
import { UserRole } from '../../models/User';
import { replaceAll } from '../../utils/string';
import { deleteDataViewByIndexPattern } from '../../api/elasticsearch/dataview';
import { deleteDashboard } from '../../api/elasticsearch/connectionDashboard';

const deleteSchemaParams = Joi.object().keys({
  robotId: Joi.string().required()
});

interface DeleteSchema {
    robotId: string
}

const deleteRobot: RequestHandler<any> = async (
  req: Request<DeleteSchema, {}, {}>,
  res,
  next
) => {
  const { params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.getByRobotId(params.robotId);
    if (!organization) { throw new BadRequest('Organization not found'); };
    if (!organization.isUserAdmin(userId)) {
      throw new Forbidden('You need to be an organization admin');
    }

    const robotToDelete = await Robot.findById(params.robotId);

    if (!robotToDelete) throw new BadRequest('Robot not found');

    await robotToDelete?.deleteOne();
    organization.robots = organization.robots.filter(e => e.toString() !== params.robotId.toLowerCase());
    await organization.save();

    const indexName = `neutron-connection-${organization.id}-${robotToDelete.id}`;
    await deleteDataViewByIndexPattern(indexName);
    await deleteDashboard(robotToDelete.id);
    return res.json({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  deleteRobot,
  { validation: { params: deleteSchemaParams } }
), { role: UserRole.Verified });
