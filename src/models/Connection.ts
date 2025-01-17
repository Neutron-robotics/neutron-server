import {
  Schema, Types, model, Document
} from 'mongoose';
import { IRobot, IRobotDTO, IRobotDocument } from './Robot';

export interface IConnection extends Document {
    robotId: Types.ObjectId;
    isActive: boolean;
    createdBy: Types.ObjectId
    createdAt: Date
    closedAt: Date
    pid: string
    port: number
    participants: Types.ObjectId[]
}

export interface IConnectionDTO {
  _id: string
  robot: string | IRobotDTO;
  isActive: boolean;
  createdBy: Types.ObjectId
  createdAt: Date
  closedAt: Date
  port: number
  participants: Types.ObjectId[]
}

interface IConnectionDocument extends IConnection {
  toDTOModel(robot?: IRobotDocument): IConnectionDTO
}

const ConnectionSchema = new Schema<IConnectionDocument>({
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
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
});

ConnectionSchema.method<IConnection>('toDTOModel', function (robot?: IRobotDocument) {
  const connectionDTO: IConnectionDTO = {
    _id: this.id,
    robot: robot?.toDTOModel() ?? this.robotId.toString(),
    isActive: this.isActive,
    createdBy: this.createdBy,
    createdAt: this.createdAt,
    closedAt: this.closedAt,
    port: this.port,
    participants: this.participants
  };
  return connectionDTO;
});

const Connection = model('Connection', ConnectionSchema);

export default Connection;
