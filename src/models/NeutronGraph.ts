import { Schema, Types, model } from 'mongoose';
import { NeutronGraphType } from '@neutron-robotics/neutron-core';

export interface INeutronNode {
  width: number;
  height: number;
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  preview: boolean;
  title: string;
  selected: boolean;
  positionAbsolute: {
    x: number;
    y: number;
  };
  dragging: boolean;
  data: any;
  canBeInput?: boolean;
  isInput?: boolean;
}

export interface INeutronEdge {
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
  id: string;
}

export interface INeutronGraph extends Document {
  title: string;
  type: NeutronGraphType
  robot: Types.ObjectId;
  part?: Types.ObjectId;
  imgUrl?: string
  createdBy: Types.ObjectId;
  modifiedBy: Types.ObjectId;
  createdAt: Date
  updatedAt: Date
  nodes: INeutronNode[];
  edges: INeutronEdge[];
}

const NeutronGraphSchema = new Schema<INeutronGraph>({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Flow', 'Connector'],
    required: true
  },
  robot: {
    type: Schema.Types.ObjectId,
    ref: 'Robot',
    required: true
  },
  part: {
    type: Schema.Types.ObjectId,
    ref: 'RobotPart'
  },
  imgUrl: {
    type: String
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  modifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  edges: {
    type: Schema.Types.Mixed,
    required: true
  },
  nodes: {
    type: Schema.Types.Mixed,
    required: true
  }
});

NeutronGraphSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const NeutronGraph = model('NeutronGraph', NeutronGraphSchema);

export default NeutronGraph;
