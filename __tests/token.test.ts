import mongoose from 'mongoose';
import moment from 'moment';
import dotenv from 'dotenv';
import Token, { TokenCategory } from '../src/models/Token';

describe('Token tests', () => {
  const result = dotenv.config();
  if (result.error) {
    dotenv.config({ path: '.env.default' });
  }
  beforeEach(async () => {
    await mongoose.connect(process.env.MONGO_URL ?? '');
  });

  afterEach(async () => {
    await mongoose.connection.close();
  });

  it('create a token', async () => {
    const tokenInfinite = await Token.create({ category: TokenCategory.AccountCreation });

    const expirationDate = moment().add(7, 'days').toDate();
    const tokenWithExpiration = await Token.create({ category: TokenCategory.AccountCreation, expirationDate });

    expect(tokenInfinite).toBeDefined();
    expect(tokenInfinite.expirationDate).not.toBeDefined();
    expect(tokenInfinite.key).toBeDefined();
    expect(tokenWithExpiration.expirationDate).toBeDefined();
    expect(tokenWithExpiration.expirationDate).toBe(expirationDate);
    expect(tokenWithExpiration.key).toBeDefined();
  });

  it('consume a token', async () => {
    const token = await Token.create({ category: TokenCategory.AccountCreation });

    const result = await token.consume();
    const foundToken = await Token.findById(token._id);

    expect(result).toBeTruthy();
    expect(foundToken).toBeNull();
  });

  it('consume an expired token should return false', async () => {
    const expirationDate = moment().subtract(1, 'days').toDate(); // Expired token
    const token = await Token.create({ category: TokenCategory.AccountCreation, expirationDate });

    const result = await token.consume();

    expect(result).toBeFalsy();
  });
});
