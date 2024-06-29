import {
  Document, Schema, model, Types
} from 'mongoose';

export interface IRobotLocationStatus {
    name: string;
}

export interface IRobotNetworkInfo {
  hostname: string
  port: string
}

export enum RobotStatus {
    Online = 'Online',
    Operating = 'Operating',
    Offline = 'Offline',
    Unknown = 'Unknown'
}

export interface IBatteryStatus {
    charging: boolean;
    level: number;
  }

export interface IRobotSystemStatus {
    cpu: number;
    memory: number;
}

export interface IRobotProcess {
  cpu: number;
  mem: number;
  mem_usage: number;
  active: boolean;
  pid: number;
  name: string;
  id: string;
}

export interface IRobotContextProcess extends IRobotProcess {
  port: number
}

export interface IRobotStatus extends Document {
    time: Date;
    status: RobotStatus;
    robot: Types.ObjectId
    battery?: IBatteryStatus;
    system?: IRobotSystemStatus;
    location?: IRobotLocationStatus;
    processes?: IRobotProcess[]
    context?: IRobotContextProcess
}

const RobotStatusSchema = new Schema<IRobotStatus>({
  time: {
    type: Date,
    default: Date.now,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(RobotStatus)
  },
  robot: {
    type: Schema.Types.ObjectId,
    ref: 'Robot'
  },
  battery: {
    type: {
      charging: {
        type: Boolean,
        required: false
      },
      level: {
        type: Number,
        required: false
      }
    },
    default: undefined
  },
  system: {
    type: {
      cpu: { type: Number },
      memory: { type: Number }
    },
    default: undefined
  },
  processes: [
    {
      cpu: { type: Number, required: true },
      mem: { type: Number, required: true },
      mem_usage: { type: Number, required: true },
      active: { type: Boolean, required: true },
      pid: { type: Number, required: true },
      name: { type: String, required: true },
      id: { type: String, required: true }
    }
  ],
  context: {
    type: {
      cpu: { type: Number, required: true },
      mem: { type: Number, required: true },
      mem_usage: { type: Number, required: true },
      active: { type: Boolean, required: true },
      pid: { type: Number, required: true },
      name: { type: String, required: true },
      id: { type: String, required: true },
      port: { type: Number, required: true }
    },
    required: false,
    default: undefined
  }
});

const RobotStatusModel = model<IRobotStatus>('RobotStatus', RobotStatusSchema);

export default RobotStatusModel;
