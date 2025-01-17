import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import { randomUUID } from 'crypto';
import Robot, { ConnectionContextType } from '../../models/Robot';
import requestMiddleware from '../../middleware/request-middleware';
import Organization from '../../models/Organization';
import { BadRequest } from '../../errors/bad-request';
import { withAuth } from '../../middleware/withAuth';
import { UserRole } from '../../models/User';
import { IRobotPart, RobotPartCategory } from '../../models/RobotPart';
import { replaceAll } from '../../utils/string';
import { createDataView } from '../../api/elasticsearch/dataview';
import { createConnectionDashboard } from '../../api/elasticsearch/connectionDashboard';

export const partsSchema = Joi.object().keys({
  type: Joi.string().required(),
  category: Joi.string().valid(...Object.values(RobotPartCategory)).required(),
  name: Joi.string().required(),
  imgUrl: Joi.string(),
  ros2Node: Joi.string().allow('').optional(),
  ros2Package: Joi.string().allow('').optional()
});

const createSchema = Joi.object().keys({
  name: Joi.string().required(),
  parts: Joi.array().items(partsSchema).optional(),
  imgUrl: Joi.string().optional(),
  description: Joi.string(),
  connectionContextType: Joi.string().valid(...Object.values(ConnectionContextType)).required(),
  organizationId: Joi.string().required()
});

interface CreateRobotBody {
    name: string
    parts: IRobotPart[]
    imgUrl: string
    description: string,
    connectionContextType: ConnectionContextType,
    organizationId: string
}

const create: RequestHandler = async (req: Request<{}, {}, CreateRobotBody>, res, next) => {
  const { body } = req;
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.findOne({ _id: body.organizationId }).exec();
    if (!organization || organization.users.find(e => e.userId === userId)) {
      throw new BadRequest('This organization does not exist');
    }
    const secretKey = randomUUID();
    const robot = new Robot({
      name: body.name,
      parts: body.parts,
      linked: false,
      secretKey,
      imgUrl: body.imgUrl,
      description: body.description,
      context: body.connectionContextType
    });
    await robot.save();
    organization.robots.push(robot._id);
    await organization.save();

    const dataviewId = await createDataView(`Robot connection ${robot.name}`, `neutron-connection-${organization.id}-${robot.id}*`);
    if (dataviewId) {
      await createConnectionDashboard({
        id: robot.id,
        title: `${organization.name} Organization - ${robot.name}`,
        dataViewId: dataviewId,
        description: `Dashboard for visualization of connection event and status for ${robot.name}`
      });
    }

    res.send({
      message: 'OK',
      id: robot.id,
      secretKey: robot.secretKey
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(create, { validation: { body: createSchema } }), { role: UserRole.Verified });
