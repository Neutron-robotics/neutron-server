import Joi from 'joi';
import { Request, RequestHandler } from 'express';
import axios from 'axios';
import { withAuth } from '../../middleware/withAuth';
import { UserRole } from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { Forbidden, NotFound } from '../../errors/bad-request';
import Organization from '../../models/Organization';
import Robot from '../../models/Robot';

interface StartRobotParams {
    robotId: string
}

interface StartRobotBody {
    partsId?: string[]
}

const startSchemaBody = Joi.object<StartRobotBody>().keys({
  partsId: Joi.array()
    .items(Joi.string())
    .optional()
});

const startSchemaParams = Joi.object<StartRobotParams>().keys({
  robotId: Joi.string().required()
});

const start: RequestHandler<any> = async (
  req: Request<StartRobotParams, {}, StartRobotBody>,
  res,
  next
) => {
  const { params, body } = req;
  const userId = (req as any).user.sub as string;

  try {
    const robot = await Robot.findById(params.robotId).lean();

    if (!robot) throw new NotFound();

    const organization = await Organization.getByRobotId(robot._id);

    if (!organization || !organization.users.find(e => e.userId.toString() === userId)) { throw new Forbidden(); };

    const parts = await robot.parts.filter(e => body?.partsId?.includes(e._id.toString()) ?? true);

    const response = await axios.post(`http://${robot.hostname}:8000/robot/start`, parts.length === 0 ? {} : { processesId: parts.map(e => e._id) });
    if (response.status !== 200) throw new Error(response.data);

    return res.json({
      message: 'OK'
    });
  } catch (error: any) {
    console.log('errpr', error)
    next(error);
  }
};

export default withAuth(requestMiddleware(
  start,
  { validation: { params: startSchemaParams, body: startSchemaBody } }
), { roles: [UserRole.Verified] });
