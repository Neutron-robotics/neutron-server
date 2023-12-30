import {
  Document, Schema, model, Types
} from 'mongoose';

export interface IRobotLocationStatus {
    name: string;
}

export interface IRobotNetworkInfo {
  hostname: string
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

export interface IRobotStatus extends Document {
    time: Date;
    status: RobotStatus;
    robot: Types.ObjectId
    battery?: IBatteryStatus;
    // connection?: INeutronConnection;
    system?: IRobotSystemStatus;
    location?: IRobotLocationStatus;
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
  //   connection: {
  //     type: Schema.Types.ObjectId,
  //     ref: 'NeutronConnection'
  //   },
  system: {
    type: {
      cpu: {
        type: Number,
        required: false
      },
      memory: {
        type: Number,
        required: false
      }
    },
    default: undefined
  },
  location: {
    type: {
      name: {
        type: String,
        required: false
      }
    },
    default: undefined
  }
});

const RobotStatusModel = model<IRobotStatus>('RobotStatus', RobotStatusSchema);

export default RobotStatusModel;
