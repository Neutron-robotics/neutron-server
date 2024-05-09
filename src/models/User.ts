import { compareSync, hash, genSalt } from 'bcrypt';
import {
  Schema, model, Document, Model
} from 'mongoose';
import { BadRequest, NotFound, Unauthorized } from '../errors/bad-request';
import logger from '../logger';
import { replaceAll } from '../utils/string';

export enum UserRole {
  User = 'user',
  Admin = 'admin',
  Verified = 'verified'
}

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  imgUrl: string
  activationKey: string | undefined;
  active: boolean;
  role: string;
}

export interface IUserDTO {
  id: string
  email: string;
  firstName: string;
  lastName: string;
  imgUrl: string
}

interface IUserDocument extends IUser {
  toDTOModel(): IUserDTO
  toElasticUsername(): string
  passwordMatches(password: string): boolean
}

interface IUserModel extends Model<IUserDocument> {
  findAndGenerateToken(payload: {
    email: string;
    password: string;
  }): Promise<IUserDocument>;
  checkDuplicateEmailError(err: any): any;
}

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: 4,
      maxlength: 128
    },
    firstName: {
      type: String,
      maxlength: 50
    },
    lastName: {
      type: String,
      maxlength: 50
    },
    imgUrl: {
      type: String
    },
    activationKey: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple documents to have a null value for activationKey
      default: null,
      validate: {
        validator(value: string | null) {
          return value === null || typeof value === 'string';
        },
        message: 'Activation key must be a string or null'
      }
    },
    active: {
      type: Boolean,
      default: false
    },
    role: {
      type: String,
      default: UserRole.User,
      enum: UserRole
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function save(next) {
  if (this.isModified('password') || this.isNew) {
    try {
      const salt = await genSalt(10);
      const h = await hash(this.password, salt);
      this.password = h;
      next();
    } catch (err: any) {
      logger.error(`Failed to pre save password ${err}`, {
        userId: this.id
      });
      next(err);
    }
  } else {
    return next();
  }
});

userSchema.method<IUser>(
  'passwordMatches',
  function passwordMatches(password: string) {
    return compareSync(password, this.password);
  }
);

userSchema.method<IUser>(
  'toDTOModel',
  function () {
    const userDTO: IUserDTO = {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      imgUrl: this.imgUrl
    };
    return userDTO;
  }
);

userSchema.method<IUser>(
  'toElasticUsername',
  function () {
    return replaceAll(`${this.firstName}-${this.lastName}`, ' ', '');
  }
);

userSchema.statics.findAndGenerateToken = async function (payload: {
  email: string;
  password: string;
}) {
  const { email, password } = payload;
  if (!email) throw new BadRequest('Email must be provided for login');

  const user = await this.findOne({ email }).exec();
  if (!user) throw new NotFound(`No user associated with ${email}`, 404);
  if (!user.active) throw new Unauthorized('User is disabled');

  const passwordOK = await user.passwordMatches(password);

  if (!passwordOK) {
    logger.info('User login with incorrect password', {
      userId: user.id
    });
    throw new Unauthorized('Password mismatch');
  }

  if (!user.active) throw new Unauthorized('User not activated');

  return user;
};

userSchema.statics.checkDuplicateEmailError = function (err: any) {
  if (err.code === 11000) {
    return new BadRequest('Email already taken');
  }
  return err;
};

const User = model<IUserDocument, IUserModel>('User', userSchema);

export default User;
