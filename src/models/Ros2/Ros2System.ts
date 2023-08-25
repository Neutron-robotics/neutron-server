import mongoose, {
  Schema, Document, Types, Model
} from 'mongoose';
import { BadRequest } from '../../errors/bad-request';

interface Ros2System {
  name: string;
  topics: Types.ObjectId[];
  publishers: Types.ObjectId[];
  subscribers: Types.ObjectId[];
  actions: Types.ObjectId[];
  services: Types.ObjectId[];
  robotId: Types.ObjectId
}

interface IRobotModel extends Model<Ros2System & Document> {
  getByRobotId(id: string): Ros2System & Document
}

const Ros2SystemSchema = new Schema<Ros2System>({
  name: {
    type: String,
    required: true
  },
  topics: [
    {
      type: Schema.Types.ObjectId,
      ref: 'ROS2TopicStructure',
      default: []
    }
  ],
  publishers: [
    {
      type: Schema.Types.ObjectId,
      ref: 'ROS2PublisherStructure',
      default: []
    }
  ],
  subscribers: [
    {
      type: Schema.Types.ObjectId,
      ref: 'ROS2SubscriberStructure',
      default: []
    }
  ],
  actions: [
    {
      type: Schema.Types.ObjectId,
      ref: 'ROS2ActionStructure',
      default: []
    }
  ],
  services: [
    {
      type: Schema.Types.ObjectId,
      ref: 'ROS2ServiceStructure',
      default: []
    }
  ],
  robotId: {
    type: Schema.Types.ObjectId,
    ref: 'Robot',
    required: true
  }
});

Ros2SystemSchema.statics.getByRobotId = async function (robotId) {
  try {
    const model = await this.findOne({ robotId });
    if (!model) {
      throw new BadRequest('Ros2System not found for the provided robotId.');
    }
    return model;
  } catch (error: any) {
    throw new BadRequest(`Error while fetching the ros2System: ${error.message}`);
  }
};

const Ros2SystemModel = mongoose.model<Ros2System & Document, IRobotModel>(
  'Ros2System',
  Ros2SystemSchema,
);

export default Ros2SystemModel;
