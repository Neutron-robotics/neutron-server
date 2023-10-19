import { Schema, Types, model } from 'mongoose';

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
  robot: Types.ObjectId;
  part: Types.ObjectId;
  createdBy: Types.ObjectId;
  modifiedBy: Types.ObjectId;
  nodes: INeutronNode[];
  edges: INeutronEdge[];
}

const NeutronGraphSchema = new Schema<INeutronGraph>({
  title: {
    type: String,
    required: true
  },
  robot: {
    type: Schema.Types.ObjectId,
    ref: 'Robot'
  },
  part: {
    type: Schema.Types.ObjectId,
    ref: 'RobotPart'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  modifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  edges: {
    type: Schema.Types.Mixed
  },
  nodes: {
    type: Schema.Types.Mixed
  }
});

const NeutronGraph = model('NeutronGraph', NeutronGraphSchema);

export default NeutronGraph;
