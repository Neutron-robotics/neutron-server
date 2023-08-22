import mongoose, { Schema, Document } from 'mongoose';

export interface Ros2Field {
  fieldtype: string;
  fieldname: string;
}

export interface ROS2ServiceMessageStructure {
  request: Ros2Field[];
  response: Ros2Field[];
}

export interface ROS2MessageStructure {
  fields: Ros2Field[]
}

export interface ROS2ActionMessageStructure {
  goal: Ros2Field[]
  feedback: Ros2Field[]
  result: Ros2Field[]
}

// Service model definition

const ROS2ServiceMessageSchema = new Schema<ROS2ServiceMessageStructure>({
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
  }
});

const ROS2ServiceMessageModel = mongoose.model<ROS2ServiceMessageStructure & Document>(
  'ROS2ServiceMessageStructure',
  ROS2ServiceMessageSchema,
);

// Message model definition

const ROS2MessageSchema = new Schema<ROS2MessageStructure>({
  fields: {
    type: [{
      fieldtype: String,
      fieldname: String
    }],
    required: true
  }
});

const ROS2MessageModel = mongoose.model<ROS2MessageStructure & Document>(
  'ROS2MessageStructure',
  ROS2MessageSchema,
);

// Action model definition

const ROS2ActionMessageSchema = new Schema<ROS2ActionMessageStructure>({
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
