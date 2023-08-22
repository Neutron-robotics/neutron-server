import mongoose, { Schema, Document } from 'mongoose';

interface ROS2SubscriberStructure {
  name: string;
  topic: mongoose.Types.ObjectId;
}

const ROS2SubscriberSchema = new Schema<ROS2SubscriberStructure>({
  name: {
    type: String,
    required: true
  },
  topic: {
    type: Schema.Types.ObjectId,
    ref: 'ROS2TopicStructure',
    required: true
  }
});

const ROS2SubscriberModel = mongoose.model<ROS2SubscriberStructure & Document>(
  'ROS2SubscriberStructure',
  ROS2SubscriberSchema,
);

export default ROS2SubscriberModel;
