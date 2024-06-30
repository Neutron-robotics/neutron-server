import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import requestMiddleware from '../../middleware/request-middleware';
import Robot from '../../models/Robot';
import { BadRequest } from '../../errors/bad-request';
import RobotStatusModel, {
  IBatteryStatus, IRobotContextProcess, IRobotLocationStatus, IRobotNetworkInfo, IRobotProcess, IRobotSystemStatus, RobotStatus
} from '../../models/RobotStatus';

export interface PublishSystemInformationRequest {
  secretKey: string,
  status: {
    status: RobotStatus,
    battery?: IBatteryStatus
    system?: IRobotSystemStatus;
    location?: IRobotLocationStatus;
    network?: IRobotNetworkInfo;
    processes?: IRobotProcess[]
    context?: IRobotContextProcess
    hash: string,
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
    }).optional(),
    network: Joi.object({
      hostname: Joi.string().required(),
      port: Joi.number().required()
    }).optional(),
    hash: Joi.string(),
    processes: Joi.array().optional(),
    context: Joi.object().allow(null).optional()
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

    if (body.status.network && body.status.network.hostname !== robot.hostname) {
      robot.hostname = body.status.network.hostname;
      await robot.save();
    }

    const robotStatus = new RobotStatusModel({
      status: body.status.status,
      robot: robot._id,
      battery: body.status.battery,
      system: body.status.system,
      location: body.status.location,
      processes: body.status.processes,
      context: body.status.context,
      port: body.status.network?.port
    });

    await robotStatus.save();

    const latestHash = robot.generateHash();

    if (body.status.hash !== latestHash) {
      return res.json({
        message: 'OK',
        configuration: {
          name: robot.name,
          context: {
            type: robot.context
          },
          parts: robot.parts.map(e => ({
            id: e._id,
            name: e.name,
            category: e.category,
            ros2Node: e.ros2Node,
            ros2Package: e.ros2Package
          }))
        }
      });
    }

    return res.json({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default requestMiddleware(publishSystemInformation, { validation: { body: publishSystemInformationSchemaBody } });
