import mongoose, { Schema, Document, Types } from 'mongoose';

interface Ros2System {
  name: string;
  topics: Types.ObjectId[];
  publishers: Types.ObjectId[];
  subscribers: Types.ObjectId[];
  actions: Types.ObjectId[];
  services: Types.ObjectId[];
  robotId: Types.ObjectId
}

const Ros2SystemSchema = new Schema<Ros2System>({
  name: {
    type: String,
    required: true,
    unique: true
  },
  topics: [
    {
      type: Schema.Types.ObjectId,
      ref: 'ROS2TopicStructure'
    }
  ],
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
  actions: [
    {
      type: Schema.Types.ObjectId,
      ref: 'ROS2ActionStructure'
    }
  ],
  services: [
    {
      type: Schema.Types.ObjectId,
      ref: 'ROS2ServiceStructure'
    }
  ],
  robotId: {
    type: Schema.Types.ObjectId,
    ref: 'Robot'
  }
});

const Ros2SystemModel = mongoose.model<Ros2System & Document>(
  'Ros2System',
  Ros2SystemSchema,
);

export default Ros2SystemModel;
