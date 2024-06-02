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
import Robot from '../../models/Robot';
import Ros2SystemModel from '../../models/Ros2/Ros2System';

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

    const robot = await Robot.findById(params.robotId);
    if (!robot) { throw new BadRequest('The robot does not exist'); };
    const part = robot.parts.find(e => e._id.toString() === params.partId);
    if (!part) { throw new BadRequest('The part does not exist'); };

    const topic = await ROS2TopicModel.findOne({ _id: body.topicId });
    if (!topic) { throw new BadRequest('The action type does not exist'); };

    const subscriber = await ROS2SubscriberModel.create({
      name: body.name,
      topic
    });

    const ros2System = await Ros2SystemModel.getByRobotId(robot.id);
    ros2System.subscribers.push(subscriber.id);
    await ros2System.save();

    part.subscribers.push(subscriber.id);
    await robot.save();

    res.send({
      message: 'OK',
      id: subscriber.id
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  createSubscriber,
  { validation: { params: createSubscriberSchemaParams, body: createSubscriberSchemaBody } }
), { role: UserRole.Verified });
