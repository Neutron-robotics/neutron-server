import Joi from 'joi';
import { RequestHandler, Request } from 'express';
import {
  ROS2ActionMessageModel,
  ROS2ActionMessageStructure, ROS2MessageModel, ROS2MessageStructure, ROS2ServiceMessageModel, ROS2ServiceMessageStructure, Ros2Field
} from '../../models/Ros2/Ros2Messages';
import requestMiddleware from '../../middleware/request-middleware';
import { withAuth } from '../../middleware/withAuth';
import Organization, { OrganizationPermissions } from '../../models/Organization';
import { BadRequest, Forbidden } from '../../errors/bad-request';
import RobotPart from '../../models/RobotPart';
import ROS2ActionModel from '../../models/Ros2/Ros2Action';
import { UserRole } from '../../models/User';

interface CreateMessageTypeParams {
  robotId: string
  partId: string
}

interface CreateMessageTypeBody {
    message?: ROS2MessageStructure
    service?: ROS2ServiceMessageStructure,
    action?: ROS2ActionMessageStructure
}

const Ros2FieldSchema = Joi.object<Ros2Field>().keys({
  fieldname: Joi.string().required(),
  fieldtype: Joi.string().required()
});

const Ros2MessageSchema = Joi.object<ROS2MessageStructure>().keys({
  fields: Joi.array().items(Ros2FieldSchema).optional()
});

const Ros2ServiceSchema = Joi.object<ROS2ServiceMessageStructure>().keys({
  request: Joi.array().items(Ros2FieldSchema).optional(),
  response: Joi.array().items(Ros2FieldSchema).optional()
});

const Ros2ActionSchema = Joi.object<ROS2ActionMessageStructure>().keys({
  goal: Joi.array().items(Ros2FieldSchema).optional(),
  feedback: Joi.array().items(Ros2FieldSchema).optional(),
  result: Joi.array().items(Ros2FieldSchema).optional()
});

const createMessageTypeSchemaBody = Joi.object<CreateMessageTypeBody>().keys({
  message: Ros2MessageSchema.optional(),
  service: Ros2ServiceSchema.optional(),
  action: Ros2ActionSchema.optional()
});

const createMessageTypeSchemaParams = Joi.object<CreateMessageTypeParams>().keys({
  robotId: Joi.string().required(),
  partId: Joi.string().required()
});

const createMessageType: RequestHandler<any> = async (req: Request<CreateMessageTypeParams, {}, CreateMessageTypeBody>, res, next) => {
  const { body, params } = req;
  const userId = (req as any).user.sub as string;

  try {
    const organization = await Organization.getByRobotId(params.robotId);
    if (!organization.isUserAllowed(userId, [OrganizationPermissions.Admin, OrganizationPermissions.Analyst, OrganizationPermissions.Operator, OrganizationPermissions.Owner])) {
      throw new Forbidden('User do not have the authorization for ros2 settings');
    };
    const part = await RobotPart.findOne({ _id: params.partId });
    if (!part) { throw new BadRequest('The part does not exist'); };

    if (body.action) {
      await ROS2ActionMessageModel.create({
        feedback: body.action.feedback,
        goal: body.action.goal,
        result: body.action.result
      });
    } else if (body.message) {
      await ROS2MessageModel.create({
        fields: body.message.fields
      });
    } else if (body.service) {
      await ROS2ServiceMessageModel.create({
        request: body.service.request,
        response: body.service.response
      });
    } else { throw new BadRequest('No messages has been defined'); };

    res.send({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  createMessageType,
  { validation: { params: createMessageTypeSchemaParams, body: createMessageTypeSchemaBody } }
), { roles: [UserRole.Verified] });
