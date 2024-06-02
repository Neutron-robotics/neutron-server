import mongoose, { Schema, Document } from 'mongoose';

export interface ROS2TopicStructure {
  name: string;
  messageType: mongoose.Types.ObjectId;
}

const ROS2TopicSchema = new Schema<ROS2TopicStructure & Document>({
  name: {
    type: String,
    required: true
  },
  messageType: {
    type: Schema.Types.ObjectId,
    ref: 'ROS2MessageStructure',
    required: true,
    autopopulate: true
  }
});
ROS2TopicSchema.plugin(require('mongoose-autopopulate'));

const ROS2TopicModel = mongoose.model<ROS2TopicStructure & Document>(
  'ROS2TopicStructure',
  ROS2TopicSchema,
);

export default ROS2TopicModel;
