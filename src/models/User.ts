/* eslint-disable consistent-return */
/* eslint-disable max-len */
/* eslint-disable func-names */
/* eslint-disable import/no-import-module-exports */
// eslint-disable-next-line import/no-extraneous-dependencies
import { compareSync, hash, genSalt } from 'bcrypt';
import {
  Schema, model, Document, Collection, Model
} from 'mongoose';
import { BadRequest, NotFound, Unauthorized } from '../errors/bad-request';
import logger from '../logger';

const roles = ['user', 'admin'];

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  activationKey: string;
  active: boolean;
  roles: string[];
}

interface IUserModel extends Model<IUser> {
  findAndGenerateToken(payload: { email: string, password: string }): Promise<IUser>
  checkDuplicateEmailError(err: any): any
}

const userSchema = new Schema<IUser>(
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
    roles: {
      type: [String],
      default: ['user'],
      enum: roles
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function save(next) {
  logger.info('pre', this.isModified('password'), this.isNew);
  if (this.isModified('password') || this.isNew) {
    try {
      const salt = await genSalt(10);
      const h = await hash(this.password, salt);
      this.password = h;
      next();
    } catch (err: any) {
      logger.error(`Error: ${err}`);
      next(err);
    }
  } else {
    return next();
  }
});

userSchema.post('save', async (doc, next) => {
  try {
    // const mailOptions = {
    //   from: 'noreply',
    //   to: this.email,
    //   subject: 'Confirm creating account',
    //   html: `<div><h1>Hello new user!</h1><p>Click <a href="${config.hostname}/api/auth/confirm?key=${this.activationKey}">link</a> to activate your new account.</p></div><div><h1>Hello developer!</h1><p>Feel free to change this template ;).</p></div>`
    // };

    // transporter.sendMail(mailOptions, (error, info) => {
    //   if (error) {
    //     console.log(error);
    //   } else {
    //     console.log(`Email sent: ${info.response}`);
    //   }
    // });

    return next();
  } catch (error: any) {
    return next(error);
  }
});

userSchema.method<IUser>('passwordMatches', function passwordMatches(password: string) {
  return compareSync(password, this.password);
});

userSchema.statics.findAndGenerateToken = async function (payload: { email: string, password: string }) {
  const { email, password } = payload;
  if (!email) throw new BadRequest('Email must be provided for login');

  const user = await this.findOne({ email }).exec();
  if (!user) throw new NotFound(`No user associated with ${email}`, 404);

  const passwordOK = await user.passwordMatches(password);

  if (!passwordOK) throw new Unauthorized('Password mismatch');

  if (!user.active) throw new Unauthorized('User not activated');

  return user;
};

userSchema.statics.checkDuplicateEmailError = function (err: any) {
  if (err.code === 11000) {
    return new BadRequest('Email already taken');
  }
  return err;
};

const User = model<IUser, IUserModel>('User', userSchema);

export default User;
