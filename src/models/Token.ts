import { randomUUID } from 'crypto';
import {
  Document, Model, Schema, model
} from 'mongoose';

export enum TokenCategory {
    AccountCreation = 'AccountCreation'
}

export interface IToken extends Document {
    key: string
    category: TokenCategory
    expirationDate?: Date
}

interface ITokenDocument extends IToken {
    hasExpired(): boolean
    consume(): boolean
}

const TokenSchema = new Schema<ITokenDocument>({
  key: {
    type: String,
    unique: true
  },
  category: {
    type: String,
    enum: Object.values(TokenCategory),
    required: true
  },
  expirationDate: {
    type: Date
  }
});

TokenSchema.pre('save', function (next) {
  if (!this.isNew || this.key) {
    return next();
  }
  this.key = randomUUID();
  next();
});

TokenSchema.method<ITokenDocument>(
  'hasExpired',
  function () {
    if (!this.expirationDate) return false;

    return new Date() > this.expirationDate;
  }
);

TokenSchema.method<ITokenDocument>(
  'consume',
  function () {
    if (this.expirationDate && new Date() > this.expirationDate) return false;
    this.deleteOne();
    return true;
  }
);

const Token = model<ITokenDocument>('Token', TokenSchema);

export default Token;
