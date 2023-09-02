import mongoose, { Schema, Document } from 'mongoose';

export interface ROS2PublisherStructure {
  name: string;
  topic: mongoose.Types.ObjectId;
  frequency: number
}

const ROS2PublisherSchema = new Schema<ROS2PublisherStructure>({
  name: {
    type: String,
    required: true
  },
  topic: {
    type: Schema.Types.ObjectId,
    ref: 'ROS2TopicStructure',
    required: true,
    autopopulate: true
  },
  frequency: {
    type: Number
  }
});
ROS2PublisherSchema.plugin(require('mongoose-autopopulate'));

const ROS2PublisherModel = mongoose.model<ROS2PublisherStructure & Document>(
  'ROS2PublisherStructure',
  ROS2PublisherSchema,
);

export default ROS2PublisherModel;
