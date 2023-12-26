import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import requestMiddleware from '../../middleware/request-middleware';
import Robot from '../../models/Robot';
import { BadRequest } from '../../errors/bad-request';

const linkSchemaBody = Joi.object().keys({
  secretKey: Joi.string().required()
});

interface LinkBody {
    secretKey: string,
}

const link: RequestHandler<any> = async (
  req: Request<{}, {}, LinkBody>,
  res,
  next
) => {
  const { body } = req;

  try {
    const robot = await Robot.findOne({ secretKey: body.secretKey }).exec();
    if (!robot) {
      throw new BadRequest('Robot not found');
    }
    if (robot.linked) {
      throw new BadRequest('Robot already linked');
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

export default requestMiddleware(link, { validation: { body: linkSchemaBody } });
