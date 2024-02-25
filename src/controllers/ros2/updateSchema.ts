import Joi from 'joi';
import { RequestHandler, Request } from 'express';
import {
  IRos2Action, IRos2Publisher, IRos2Service, IRos2Subscriber, IRos2Topic
} from '@hugoperier/neutron-core';
import Organization, {
  OrganizationPermissions
} from '../../models/Organization';
import { BadRequest, Forbidden } from '../../errors/bad-request';
import Robot from '../../models/Robot';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import { UserRole } from '../../models/User';
import ROS2PublisherModel from '../../models/Ros2/Ros2Publisher';
import ROS2SubscriberModel from '../../models/Ros2/Ros2Subscriber';
import ROS2TopicModel from '../../models/Ros2/Ros2Topic';
import ROS2ServiceModel from '../../models/Ros2/Ros2Service';
import ROS2ActionModel from '../../models/Ros2/Ros2Action';

interface UpdateSchemaBody {
  publisher?: IRos2Publisher;
  subscriber?: IRos2Subscriber;
  topic?: IRos2Topic;
  action?: IRos2Action;
  service: IRos2Service
}

interface UpdateSchemaParams {
  robotId: string;
  schema: 'publisher' | 'action' | 'service' | 'topic' | 'subscriber';
}

const updateSchemaBody = Joi.object<UpdateSchemaBody>().keys({
  publisher: Joi.object().optional(),
  subscriber: Joi.object().optional(),
  topic: Joi.object().optional(),
  action: Joi.object().optional(),
  service: Joi.object().optional()
});

const updateSchemaParams = Joi.object<UpdateSchemaParams>().keys({
  robotId: Joi.string().required(),
  schema: Joi.string().required()
});

const updateSchema: RequestHandler<any> = async (
  req: Request<UpdateSchemaParams, {}, UpdateSchemaBody>,
  res,
  next
) => {
  const { body, params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.getByRobotId(params.robotId);
    if (
      !organization.isUserAllowed(userId, [
        OrganizationPermissions.Admin,
        OrganizationPermissions.Analyst,
        OrganizationPermissions.Operator,
        OrganizationPermissions.Owner
      ])
    ) {
      throw new Forbidden(
        'User do not have the authorization for ros2 settings'
      );
    }

    const robot = await Robot.findById(params.robotId);
    if (!robot) {
      throw new BadRequest('The robot does not exist');
    }

    switch (params.schema) {
      case 'publisher':
        await ROS2PublisherModel.findByIdAndUpdate(body.publisher!._id, {
          name: body.publisher!.name,
          frequency: body.publisher!.frequency,
          topic: body.publisher!.topic._id
        });
        break;

      case 'subscriber':
        await ROS2SubscriberModel.findByIdAndUpdate(body.subscriber!._id, {
          name: body.subscriber!.name,
          topic: body.subscriber!.topic._id
        });
        break;

      case 'topic':
        await ROS2TopicModel.findByIdAndUpdate(body.topic?._id, {
          name: body.topic?.name,
          messageType: body.topic?.messageType?._id
        });
        break;

      case 'service':
        await ROS2ServiceModel.findByIdAndUpdate(body.service!._id, {
          name: body.service!.name,
          serviceType: body.service.serviceType!._id
        });
        break;

      case 'action':
        await ROS2ActionModel.findByIdAndUpdate(body.action!._id, {
          name: body.action!.name,
          actionType: body.action!.actionType!._id
        });
        break;

      default:
        throw new BadRequest('No payload is given for this object');
    }

    res.send({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(
  requestMiddleware(updateSchema, {
    validation: {
      params: updateSchemaParams,
      body: updateSchemaBody
    }
  }),
  { roles: [UserRole.Verified] }
);
