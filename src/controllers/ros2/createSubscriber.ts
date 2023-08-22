import { RequestHandler, Request } from 'express';
import Joi from 'joi';
import { withAuth } from '../../middleware/withAuth';
import requestMiddleware from '../../middleware/request-middleware';
import { UserRole } from '../../models/User';
import { BadRequest, Forbidden } from '../../errors/bad-request';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import RobotPart from '../../models/RobotPart';
import ROS2TopicModel from '../../models/Ros2/Ros2Topic';
import ROS2SubscriberModel from '../../models/Ros2/Ros2Subscriber';

interface CreateSubscriberBody {
    name: string,
    topicId: string,
  }

interface CreateSubscriberParams {
    robotId: string
    partId: string
}

const createSubscriberSchemaBody = Joi.object<CreateSubscriberBody>().keys({
  name: Joi.string().required(),
  topicId: Joi.string().required()
});

const createSubscriberSchemaParams = Joi.object<CreateSubscriberParams>().keys({
  robotId: Joi.string().required(),
  partId: Joi.string().required()
});

const createSubscriber: RequestHandler<any> = async (req: Request<CreateSubscriberParams, {}, CreateSubscriberBody>, res, next) => {
  const { body, params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.getByRobotId(params.robotId);
    if (!organization.isUserAllowed(userId, [OrganizationPermissions.Admin, OrganizationPermissions.Analyst, OrganizationPermissions.Operator, OrganizationPermissions.Owner])) {
      throw new Forbidden('User do not have the authorization for creating a new part');
    };

    const part = await RobotPart.findOne({ _id: params.partId });
    if (!part) { throw new BadRequest('The part does not exist'); };

    const topic = ROS2TopicModel.findOne({ _id: body.topicId });
    if (!topic) { throw new BadRequest('The action type does not exist'); };

    await ROS2SubscriberModel.create({
      name: body.name,
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
  createSubscriber,
  { validation: { params: createSubscriberSchemaParams, body: createSubscriberSchemaBody } }
), { roles: [UserRole.Verified] });
