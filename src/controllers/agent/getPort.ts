import { Request, RequestHandler } from 'express';
import Joi from 'joi';
import requestMiddleware from '../../middleware/request-middleware';
import { BadRequest } from '../../errors/bad-request';
import Robot from '../../models/Robot';
import { findFreeTcpPortWithinRange, parseRange } from '../../utils/network';
import ApplicationError from '../../errors/application-error';

export interface GetPortRequestBody {
    secretKey: string,
}

const getPortSchemaBody = Joi.object().keys({
  secretKey: Joi.string().required()
});

const getPort: RequestHandler<any> = async (
  req: Request<{}, {}, GetPortRequestBody>,
  res,
  next
) => {
  const { body } = req;

  try {
    const portRange = parseRange(process.env.CONNECTION_PORT_RANGE ?? '');
    if (!portRange) throw new ApplicationError('Port range not defined');

    const robot = await Robot.findOne({ secretKey: body.secretKey }).exec();
    if (!robot) {
      throw new BadRequest('Robot not found');
    }
    if (!robot.linked) { throw new BadRequest('Robot not linked'); }

    const port = await findFreeTcpPortWithinRange(portRange[0], portRange[1]);

    if (!port) throw new ApplicationError('No ports available');

    return res.json({
      message: 'OK',
      port
    });
  } catch (error: any) {
    next(error);
  }
};

export default requestMiddleware(getPort, { validation: { body: getPortSchemaBody } });
