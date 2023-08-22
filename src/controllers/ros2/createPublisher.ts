import { RequestHandler, Request } from 'express';
import Joi from 'joi';
import { withAuth } from '../../middleware/withAuth';
import requestMiddleware from '../../middleware/request-middleware';
import { UserRole } from '../../models/User';
import { BadRequest, Forbidden } from '../../errors/bad-request';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import RobotPart from '../../models/RobotPart';
import ROS2TopicModel from '../../models/Ros2/Ros2Topic';
import ROS2PublisherModel from '../../models/Ros2/Ros2Publisher';

interface CreatePublisherBody {
    name: string,
    topicId: string,
    frequency: number
  }

interface CreatePublisherParams {
    robotId: string
    partId: string
}

const createPublisherSchemaBody = Joi.object<CreatePublisherBody>().keys({
  name: Joi.string().required(),
  topicId: Joi.string().required(),
  frequency: Joi.number().positive().required()
});

const createPublisherSchemaParams = Joi.object<CreatePublisherParams>().keys({
  robotId: Joi.string().required(),
  partId: Joi.string().required()
});

const createPublisher: RequestHandler<any> = async (req: Request<CreatePublisherParams, {}, CreatePublisherBody>, res, next) => {
  const { body, params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.getByRobotId(params.robotId);
    if (!organization.isUserAllowed(userId, [OrganizationPermissions.Admin, OrganizationPermissions.Analyst, OrganizationPermissions.Operator, OrganizationPermissions.Owner])) {
      throw new Forbidden('User do not have the authorization for ros2 settings');
    };

    const part = await RobotPart.findOne({ _id: params.partId });
    if (!part) { throw new BadRequest('The part does not exist'); };

    const topic = ROS2TopicModel.findOne({ _id: body.topicId });
    if (!topic) { throw new BadRequest('The topic does not exist'); };

    await ROS2PublisherModel.create({
      name: body.name,
      frequency: body.frequency,
      topic
    });

    res.send({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  createPublisher,
  { validation: { params: createPublisherSchemaParams, body: createPublisherSchemaBody } }
), { roles: [UserRole.Verified] });
