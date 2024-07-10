import bodyParser from 'body-parser';
import compression from 'compression';
import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import ApplicationError from './errors/application-error';
import routes from './routes';
import logger from './logger';
import createWebSocketProxyServer from './utils/createWebSocketProxyServer';

const app = express();

function logResponseTime(req: Request, res: Response, next: NextFunction) {
  const startHrTime = process.hrtime();

  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;
    const userId = (req as any).user?.sub ?? 'anonymous';

    logger.info(
      '',
      {
        method: req.method,
        userId,
        statusCode: res.statusCode,
        duration: elapsedTimeInMs,
        path: req.path,
        label: 'API'
      }
    );
  });

  next();
}

app.use(cors());
app.use(logResponseTime);

app.use(compression() as any);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 })
);

app.use(routes);

app.use(
  (err: ApplicationError, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }

    return res.status(err.status || 500).json({
      error: err.message
    });
  }
);

if (process.env.WS_PROXY) {
  const wsProxy = +process.env.WS_PROXY;
  logger.info(`🌐 Enabling WS proxy on port ${wsProxy}`);
  createWebSocketProxyServer(wsProxy);
}

export default app;
