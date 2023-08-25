import {
  Schema, model, Document, Types
} from 'mongoose';

export enum RobotPartCategory {
    Actuator = 'actuator',
    Vison = 'vision',
    Base = 'base'
}

export interface IRobotPart extends Document {
    type: string
    category: RobotPartCategory
    name: string
    imgUrl: string
    publishers: Types.ObjectId[];
    subscribers: Types.ObjectId[];
    services: Types.ObjectId[];
    actions: Types.ObjectId[];
}

export const RobotPartSchema = new Schema<IRobotPart>({
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
  },
  publishers: [
    {
      type: Schema.Types.ObjectId,
      ref: 'ROS2PublisherStructure'
    }
  ],
  subscribers: [
    {
      type: Schema.Types.ObjectId,
      ref: 'ROS2SubscriberStructure'
    }
  ],
  services: [
    {
      type: Schema.Types.ObjectId,
      ref: 'ROS2ServiceStructure'
    }
  ],
  actions: [
    {
      type: Schema.Types.ObjectId,
      ref: 'ROS2ActionStructure'
    }
  ]
});

const RobotPart = model<IRobotPart>('RobotPart', RobotPartSchema);

export default RobotPart;
