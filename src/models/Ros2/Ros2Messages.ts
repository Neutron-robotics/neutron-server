import mongoose, { Schema, Document } from 'mongoose';

export interface Ros2Field {
  fieldtype: string;
  fieldname: string;
}

export interface ROS2ServiceMessageStructure {
  name: string
  request: Ros2Field[];
  response: Ros2Field[];
  isStandard: boolean
}

export interface ROS2MessageStructure {
  name: string
  fields: Ros2Field[]
  isStandard: boolean
}

export interface ROS2ActionMessageStructure {
  name: string
  goal: Ros2Field[]
  feedback: Ros2Field[]
  result: Ros2Field[]
  isStandard: boolean
}

// Service model definition

const ROS2ServiceMessageSchema = new Schema<ROS2ServiceMessageStructure & Document>({
  request: {
    type: [{
      fieldtype: String,
      fieldname: String
    }],
    required: true
  },
  response: {
    type: [{
      fieldtype: String,
      fieldname: String
    }],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  isStandard: {
    type: Boolean,
    required: false,
    default: false
  }
});

const ROS2ServiceMessageModel = mongoose.model<ROS2ServiceMessageStructure & Document>(
  'ROS2ServiceMessageStructure',
  ROS2ServiceMessageSchema,
);

// Message model definition

const ROS2MessageSchema = new Schema<ROS2MessageStructure & Document>({
  fields: {
    type: [{
      fieldtype: String,
      fieldname: String
    }],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  isStandard: {
    type: Boolean,
    required: false,
    default: false
  }
});

const ROS2MessageModel = mongoose.model<ROS2MessageStructure & Document>(
  'ROS2MessageStructure',
  ROS2MessageSchema,
);

// Action model definition

const ROS2ActionMessageSchema = new Schema<ROS2ActionMessageStructure & Document>({
  goal: {
    type: [{
      fieldtype: String,
      fieldname: String
    }],
    required: true
  },
  feedback: {
    type: [{
      fieldtype: String,
      fieldname: String
    }],
    required: true
  },
  result: {
    type: [{
      fieldtype: String,
      fieldname: String
    }],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  isStandard: {
    type: Boolean,
    required: false,
    default: false
  }
});

const ROS2ActionMessageModel = mongoose.model<ROS2ActionMessageStructure & Document>(
  'ROS2ActionMessageStructure',
  ROS2ActionMessageSchema,
);

export {
  ROS2MessageModel,
  ROS2ServiceMessageModel,
  ROS2ActionMessageModel
};
