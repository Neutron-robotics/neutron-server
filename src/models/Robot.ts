import {
  Document, Schema, model
} from 'mongoose';
import { createHash } from 'crypto';
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
    hostname: string
    context: ConnectionContextType
}

interface IRobotDocument extends IRobot {
  generateHash(): string
}

const RobotSchema = new Schema<IRobotDocument>({
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
  hostname: {
    type: String
  },
  context: {
    type: String,
    enum: Object.values(ConnectionContextType)
  }
});

RobotSchema.method<IRobot>(
  'generateHash',
  function () {
    const currentConfiguration: any = {
      name: this.name,
      context: {
        type: this.context
      },
      parts: this.parts.map(e => ({
        id: e._id,
        name: e.name,
        category: e.category,
        ros2Node: e.ros2Node,
        ros2Package: e.ros2Package
      }))
    };

    const jsonString = JSON.stringify(currentConfiguration);
    return createHash('sha256').update(jsonString).digest('hex');
  }
);

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

const Robot = model<IRobotDocument>('Robot', RobotSchema);

export default Robot;
