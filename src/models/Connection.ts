import { Schema, Types, model } from 'mongoose';

export interface IConnection {
    robotId: Types.ObjectId;
    isActive: boolean;
    createdBy: Types.ObjectId
    createdAt: Date
    closedAt: Date
    pid: string
    port: number
}

const ConnectionSchema = new Schema<IConnection>({
  robotId: {
    type: Schema.Types.ObjectId,
    ref: 'Robot',
    required: true
  },
  isActive: {
    type: Boolean
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  closedAt: {
    type: Date
  },
  pid: {
    type: String,
    required: true
  },
  port: {
    type: Number,
    required: true
  }
});

const ConnectionGraph = model('Connection', ConnectionSchema);

export default ConnectionGraph;
