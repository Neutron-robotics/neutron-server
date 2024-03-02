import { Request, RequestHandler } from 'express';
import { withAuth } from '../../middleware/withAuth';
import { UserRole } from '../../models/User';
import requestMiddleware from '../../middleware/request-middleware';
import { ROS2ActionMessageModel, ROS2MessageModel, ROS2ServiceMessageModel } from '../../models/Ros2/Ros2Messages';

const getPrimitiveTypes: RequestHandler<any> = async (
  req: Request<{}, {}, {}>,
  res,
  next
) => {
  try {
    const messageTypes = await ROS2MessageModel.find({ isStandard: true }).lean().exec();
    const serviceTypes = await ROS2ServiceMessageModel.find({ isStandard: true }).lean().exec();
    const actionTypes = await ROS2ActionMessageModel.find({ isStandard: true }).lean().exec();

    return res.json({
      message: 'OK',
      types: {
        messages: messageTypes,
        services: serviceTypes,
        actions: actionTypes
      }
    });
  } catch (error: any) {
    next(error);
  }
};

export default withAuth(requestMiddleware(
  getPrimitiveTypes
), { roles: [UserRole.Verified] });
