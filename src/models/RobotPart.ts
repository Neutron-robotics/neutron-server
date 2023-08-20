import { Schema, model, Document } from 'mongoose';

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
  }
});

const RobotPart = model<IRobotPart>('RobotPart', RobotPartSchema);

export default RobotPart;
