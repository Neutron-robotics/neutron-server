import { RequestHandler, Request } from 'express';
import Joi from 'joi';
import { withAuth } from '../../middleware/withAuth';
import requestMiddleware from '../../middleware/request-middleware';
import { UserRole } from '../../models/User';
import { BadRequest, Forbidden } from '../../errors/bad-request';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import RobotPart from '../../models/RobotPart';
import ROS2TopicModel from '../../models/Ros2/Ros2Topic';
import { ROS2MessageModel } from '../../models/Ros2/Ros2Messages';

interface CreateTopicBody {
    name: string,
    messageTypeId: string
  }

interface CreateTopicParams {
    robotId: string
    partId: string
}

const createTopicSchemaBody = Joi.object<CreateTopicBody>().keys({
  name: Joi.string().required(),
  messageTypeId: Joi.string().required()
});

const createTopicSchemaParams = Joi.object<CreateTopicParams>().keys({
  robotId: Joi.string().required(),
  partId: Joi.string().required()
});

const createTopic: RequestHandler<any> = async (req: Request<CreateTopicParams, {}, CreateTopicBody>, res, next) => {
  const { body, params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.getByRobotId(params.robotId);
    if (!organization.isUserAllowed(userId, [OrganizationPermissions.Admin, OrganizationPermissions.Analyst, OrganizationPermissions.Operator, OrganizationPermissions.Owner])) {
      throw new Forbidden('User do not have the authorization for ros2 settings');
    };

    const part = await RobotPart.findOne({ _id: params.partId });
    if (!part) { throw new BadRequest('The part does not exist'); };

    const messageType = await ROS2MessageModel.find({
      _id: body.messageTypeId
    });
    if (!messageType) { throw new BadRequest('The messageType does not exist'); };

    await ROS2TopicModel.create({
      name: body.name,
      messageType
    });

    res.send({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  createTopic,
  { validation: { params: createTopicSchemaParams, body: createTopicSchemaBody } }
), { roles: [UserRole.Verified] });
