import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import requestMiddleware from '../../middleware/request-middleware';
import Robot from '../../models/Robot';
import { BadRequest } from '../../errors/bad-request';
import RobotStatusModel, {
  IBatteryStatus, IRobotLocationStatus, IRobotSystemStatus, RobotStatus
} from '../../models/RobotStatus';

export interface PublishSystemInformationRequest {
  secretKey: string,
  status: {
    status: RobotStatus,
    battery?: IBatteryStatus
    system?: IRobotSystemStatus;
    location?: IRobotLocationStatus;
  }
}

const publishSystemInformationSchemaBody = Joi.object().keys({
  secretKey: Joi.string().required(),
  status: Joi.object({
    status: Joi.string().required(),
    battery: Joi.object({
      level: Joi.number().required(),
      charging: Joi.boolean().required()
    }).optional(),
    system: Joi.object({
      cpu: Joi.number().required(),
      memory: Joi.number().required()
    }).optional(),
    location: Joi.object({
      name: Joi.string().required()
    }).optional()
  })
});

const publishSystemInformation: RequestHandler<any> = async (
  req: Request<{}, {}, PublishSystemInformationRequest>,
  res,
  next
) => {
  const { body } = req;

  try {
    const robot = await Robot.findOne({ secretKey: body.secretKey }).exec();
    if (!robot) {
      throw new BadRequest('Robot not found');
    }
    if (!robot.linked) { throw new BadRequest('Robot not linked'); }

    const robotStatus = new RobotStatusModel({
      status: body.status.status,
      robot: robot._id,
      battery: body.status.battery,
      system: body.status.system,
      location: body.status.location
    });

    await robotStatus.save();
    return res.json({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default requestMiddleware(publishSystemInformation, { validation: { body: publishSystemInformationSchemaBody } });
