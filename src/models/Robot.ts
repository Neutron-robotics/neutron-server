import {
  Document, Model, Schema, model
} from 'mongoose';

export enum RobotPartCategory {
    Actuator = 'actuator',
    Vison = 'vision',
    Base = 'base'
}

export enum ConnectionContextType {
    Ros2 = 'ros2',
    Tcp = 'tcp',
    WebSocket = 'websocket'
}

export interface IRobotPart {
    type: string
    category: RobotPartCategory
    name: string
    imgUrl: string
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

const RobotPartSchema = new Schema<IRobotPart>({
  type: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: Object.values(RobotPartCategory),
    required: true
  },
  name: {
    type: String,
    required: true
  },
  imgUrl: {
    type: String
  }
});

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

const Robot = model<IRobot>('Robot', RobotSchema);

export default Robot;
