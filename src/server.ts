import dotenv from 'dotenv';
import util from 'util';
import app from './app';
import SafeMongooseConnection from './lib/safe-mongoose-connection';
import runStartUpActions from './startup';
import logger from './logger';

const result = dotenv.config();
if (result.error) {
  dotenv.config({ path: '.env.default' });
}

const PORT = process.env.PORT || 3000;

let debugCallback;
if (process.env.NODE_ENV === 'development') {
  debugCallback = (collectionName: string, method: string, query: any, doc: string): void => {
    const message = `${collectionName}.${method}(${util.inspect(query, { colors: true, depth: null })})`;
    logger.log({
      level: 'verbose',
      message,
      consoleLoggerOptions: { label: 'MONGO' }
    });
  };
}

const safeMongooseConnection = new SafeMongooseConnection({
  mongoUrl: process.env.MONGO_URL ?? '',
  debugCallback,
  onStartConnection: mongoUrl => logger.info(`Connecting to MongoDB at ${mongoUrl}`),
  onConnectionError: (error, mongoUrl) => logger.log({
    level: 'error',
    message: `Could not connect to MongoDB at ${mongoUrl}`,
    error
  }),
  onConnectionRetry: mongoUrl => logger.info(`Retrying to MongoDB at ${mongoUrl}`)
});

const serve = () => app.listen(PORT, () => {
  logger.info(`🌏 Express server started at http://localhost:${PORT}`);
});

if (process.env.MONGO_URL == null) {
  logger.error('MONGO_URL not specified in environment', new Error('MONGO_URL not specified in environment'));
  process.exit(1);
} else {
  safeMongooseConnection.connect(async mongoUrl => {
    logger.info(`Connected to MongoDB at ${mongoUrl}`);
    await runStartUpActions();
    serve();
  });
}

// Close the Mongoose connection, when receiving SIGINT
process.on('SIGINT', async () => {
  console.log('\n'); /* eslint-disable-line */
  logger.info('Gracefully shutting down');
  logger.info('Closing the MongoDB connection');
  try {
    await safeMongooseConnection.close(true);
    logger.info('Mongo connection closed successfully');
  } catch (err) {
    logger.log({
      level: 'error',
      message: 'Error shutting closing mongo connection',
      error: err
    });
  }
  process.exit(0);
});
