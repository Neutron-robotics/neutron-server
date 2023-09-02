import mongoose, { Schema, Document } from 'mongoose';

export interface ROS2ActionStructure {
  name: string;
  actionType: mongoose.Types.ObjectId;
}

const ROS2ActionSchema = new Schema<ROS2ActionStructure>({
  name: {
    type: String,
    required: true
  },
  actionType: {
    type: Schema.Types.ObjectId,
    ref: 'ROS2ActionMessageStructure',
    required: true,
    autopopulate: true
  }
});

ROS2ActionSchema.plugin(require('mongoose-autopopulate'));

const ROS2ActionModel = mongoose.model<ROS2ActionStructure & Document>(
  'ROS2ActionStructure',
  ROS2ActionSchema,
);

export default ROS2ActionModel;
