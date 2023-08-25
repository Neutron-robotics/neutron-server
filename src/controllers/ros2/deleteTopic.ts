import { RequestHandler, Request } from 'express';
import Joi from 'joi';
import { withAuth } from '../../middleware/withAuth';
import requestMiddleware from '../../middleware/request-middleware';
import { UserRole } from '../../models/User';
import { BadRequest, Forbidden } from '../../errors/bad-request';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import RobotPart from '../../models/RobotPart';
import ROS2TopicModel from '../../models/Ros2/Ros2Topic';
import Robot from '../../models/Robot';
import Ros2SystemModel from '../../models/Ros2/Ros2System';

interface DeleteTopicParams {
    robotId: string
    partId: string
    topicId: string
}

const deleteTopicSchemaParams = Joi.object<DeleteTopicParams>().keys({
  robotId: Joi.string().required(),
  partId: Joi.string().required(),
  topicId: Joi.string().required()
});

const deleteTopic: RequestHandler<any> = async (req: Request<DeleteTopicParams, {}, {}>, res, next) => {
  const { params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.getByRobotId(params.robotId);
    if (!organization.isUserAllowed(userId, [OrganizationPermissions.Admin, OrganizationPermissions.Analyst, OrganizationPermissions.Operator, OrganizationPermissions.Owner])) {
      throw new Forbidden('User do not have the authorization for deleting ros2 related protocol');
    };

    const robot = await Robot.findById(params.robotId);
    if (!robot) { throw new BadRequest('The robot does not exist'); };
    const part = robot.parts.find(e => e._id.toString() === params.partId);
    if (!part) { throw new BadRequest('The part does not exist'); };

    const ros2System = await Ros2SystemModel.getByRobotId(robot.id);
    ros2System.topics = ros2System.topics.filter(e => e._id.toString() !== params.topicId);
    await ros2System.save();

    await ROS2TopicModel.deleteOne({ _id: params.topicId });

    res.send({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  deleteTopic,
  { validation: { params: deleteTopicSchemaParams } }
), { roles: [UserRole.Verified] });
