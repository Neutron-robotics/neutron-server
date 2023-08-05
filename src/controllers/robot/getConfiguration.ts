import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import requestMiddleware from '../../middleware/request-middleware';
import { BadRequest } from '../../errors/bad-request';
import Robot from '../../models/Robot';

const getConfigurationSchemaParams = Joi.object().keys({
  secretKey: Joi.string().required()
});

interface GetConfigurationParams {
    secretKey: string
}

const getConfiguration: RequestHandler<any> = async (
  req: Request<GetConfigurationParams, {}, {}>,
  res,
  next
) => {
  const { params } = req;

  try {
    const robot = await Robot.findOne({ secretKey: params.secretKey }).lean().exec();
    if (!robot) {
      throw new BadRequest('Robot not found');
    }
    res.json({
      message: 'OK',
      robot
    });
  } catch (error: any) {
    next(error);
  }
};

export default requestMiddleware(
  getConfiguration,
  { validation: { params: getConfigurationSchemaParams } }
);
