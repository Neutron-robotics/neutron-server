import {
  Document, Schema, model
} from 'mongoose';
import Organization from './Organization';
import { IRobotPart, RobotPartSchema } from './RobotPart';
import Ros2SystemModel from './Ros2/Ros2System';

export enum ConnectionContextType {
    Ros2 = 'ros2',
    Tcp = 'tcp',
    WebSocket = 'websocket'
}

export interface IRobot extends Document {
    name: string
    parts: IRobotPart[]
    linked: boolean
    secretKey: string
    imgUrl: string
    description: string
    context: ConnectionContextType
}

const RobotSchema = new Schema<IRobot>({
  name: {
    type: String,
    required: true
  },
  parts: {
    type: [RobotPartSchema],
    default: []
  },
  linked: {
    type: Boolean,
    default: false
  },
  secretKey: {
    type: String,
    default: null
  },
  imgUrl: {
    type: String
  },
  description: {
    type: String
  },
  context: {
    type: String,
    enum: Object.values(ConnectionContextType)
  }
});

RobotSchema.post('deleteOne', async function postDelete(doc, next) {
  try {
    const robotId = this.getFilter()['_id'];
    const organization = await Organization.getByRobotId(robotId);
    organization.robots = organization.robots.filter(e => e.toString() !== robotId.toString());
    await organization.save();
    return next();
  } catch (err: any) {
    return next(err);
  }
});

RobotSchema.pre('save', async function onCreate(done) {
  if (!this.isNew) {
    return done();
  }

  await Ros2SystemModel.create({
    name: this.name,
    robotId: this._id
  });
});

const Robot = model<IRobot>('Robot', RobotSchema);

export default Robot;
