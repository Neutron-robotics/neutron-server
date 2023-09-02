import mongoose, { Schema, Document } from 'mongoose';

export interface ROS2ServiceStructure {
  name: string;
  serviceType: mongoose.Types.ObjectId;
}

const ROS2ServiceSchema = new Schema<ROS2ServiceStructure>({
  name: {
    type: String,
    required: true
  },
  serviceType: {
    type: Schema.Types.ObjectId,
    ref: 'ROS2ServiceMessageStructure',
    required: true,
    autopopulate: true
  }
});

ROS2ServiceSchema.plugin(require('mongoose-autopopulate'));

const ROS2ServiceModel = mongoose.model<ROS2ServiceStructure & Document>(
  'ROS2ServiceStructure',
  ROS2ServiceSchema,
);

export default ROS2ServiceModel;
