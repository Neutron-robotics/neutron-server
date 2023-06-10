import {
  Document, Model, Schema, model
} from 'mongoose';
import { BadRequest } from '../errors/bad-request';

interface IUserRelation {
    userId: string,
    permissions: string[]
}

export interface IOrganization extends Document {
    name: string;
    company: string;
    description: string;
    imgUrl: string;
    robots: [];
    active: boolean;
    users: IUserRelation[]
}

interface IOrganizationModel extends Model<IOrganization> {
    checkDuplicateNameError(err: any): any
}

const OrganizationSchema = new Schema<IOrganization>({
  name: {
    type: String,
    required: true,
    unique: true
  },
  company: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  imgUrl: {
    type: String
  },
  robots: {
    type: [],
    default: []
  },
  active: {
    type: Boolean,
    default: true
  },
  users: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    permissions: []
  }]
});

OrganizationSchema.statics.checkDuplicateEmailError = function (err: any) {
  if (err.code === 11000) {
    return new BadRequest('Name already used');
  }
  return err;
};

const Organization = model<IOrganization, IOrganizationModel>('Organization', OrganizationSchema);

export default Organization;
