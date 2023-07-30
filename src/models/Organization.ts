import {
  Document, Model, Schema, model
} from 'mongoose';
import { BadRequest } from '../errors/bad-request';

export enum OrganizationPermissions {
  Guest = 'guest',
  Operator = 'operator',
  Analyst = 'analyst',
  Owner = 'owner',
  Admin = 'admin'
}

interface IUserRelation {
    userId: string,
    permissions: string[]
}

export interface IOrganization extends Document {
    name: string;
    company: string;
    description: string;
    imgUrl: string;
    robots: string[];
    active: boolean;
    users: IUserRelation[]
}

interface IOrganizationDocument extends IOrganization {
  isUserAdmin(userId: string): boolean
}

interface IOrganizationModel extends Model<IOrganizationDocument> {
  checkDuplicateError(err: any): any
  getByRobotId(id: string): IOrganizationDocument
}

const OrganizationSchema = new Schema<IOrganizationDocument>({
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
  robots: [{
    type: Schema.Types.ObjectId,
    ref: 'Robot'
  }],
  active: {
    type: Boolean,
    default: true
  },
  users: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    permissions: {
      type: [String],
      enum: Object.values(OrganizationPermissions)
    }
  }]
});

OrganizationSchema.statics.checkDuplicateError = function (err: any) {
  if (err.code === 11000) {
    return new BadRequest('Name already used');
  }
  return err;
};

OrganizationSchema.statics.getByRobotId = async function (robotId) {
  try {
    const organization = await this.findOne({ robots: { $elemMatch: { $eq: robotId } } });
    if (!organization) {
      throw new BadRequest('Organization not found for the provided robotId.');
    }
    return organization;
  } catch (error: any) {
    throw new BadRequest(`Error while fetching the organization: ${error.message}`);
  }
};

OrganizationSchema.method<IOrganization>(
  'isUserAdmin',
  function (userId: string) {
    const user: IUserRelation | undefined = this.users.find(e => e.userId === userId);
    if (!user) { return false; };

    return !!user.permissions.find(
      e => e === OrganizationPermissions.Owner
      || e === OrganizationPermissions.Admin
    );
  }
);

const Organization = model<IOrganizationDocument, IOrganizationModel>('Organization', OrganizationSchema);

export default Organization;
