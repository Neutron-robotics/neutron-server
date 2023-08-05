import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import requestMiddleware from '../../middleware/request-middleware';
import Robot from '../../models/Robot';
import { BadRequest } from '../../errors/bad-request';

const activateSchemaBody = Joi.object().keys({
  secretKey: Joi.string().required()
});

interface ActivateBody {
    secretKey: string,
}

const activate: RequestHandler<any> = async (
  req: Request<{}, {}, ActivateBody>,
  res,
  next
) => {
  const { body } = req;

  try {
    const robot = await Robot.findOne({ secretKey: body.secretKey }).exec();
    if (!robot) {
      throw new BadRequest('Robot not found');
    }
    robot.linked = true;
    await robot.save();
    return res.json({
      message: 'OK'
    });
  } catch (error: any) {
    next(error);
  }
};

export default requestMiddleware(activate, { validation: { body: activateSchemaBody } });
