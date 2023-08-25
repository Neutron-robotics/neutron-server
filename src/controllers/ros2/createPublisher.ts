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
import Robot from '../../models/Robot';
import Ros2SystemModel from '../../models/Ros2/Ros2System';

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

    const robot = await Robot.findById(params.robotId);
    if (!robot) { throw new BadRequest('The robot does not exist'); };
    const part = robot.parts.find(e => e._id.toString() === params.partId);
    if (!part) { throw new BadRequest('The part does not exist'); };

    const topic = await ROS2TopicModel.findOne({ _id: body.topicId });
    if (!topic) { throw new BadRequest('The topic does not exist'); };

    const publisher = await ROS2PublisherModel.create({
      name: body.name,
      frequency: body.frequency,
      topic
    });

    const ros2System = await Ros2SystemModel.getByRobotId(robot.id);
    ros2System.publishers.push(publisher.id);
    await ros2System.save();

    part.publishers.push(publisher.id);
    await robot.save();

    res.send({
      message: 'OK',
      id: publisher.id
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  createPublisher,
  { validation: { params: createPublisherSchemaParams, body: createPublisherSchemaBody } }
), { roles: [UserRole.Verified] });
