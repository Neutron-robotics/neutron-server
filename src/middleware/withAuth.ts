import {
  RequestHandler, Request, Response, NextFunction
} from 'express';
import { verify } from 'jsonwebtoken';
import { IUser } from '../models/User';
import { Forbidden, Unauthorized } from '../errors/bad-request';

interface AuthOptions {
    roles?: string[]
  }

export const withAuth = (
  handler: RequestHandler,
  options?: AuthOptions
): RequestHandler => async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next(new Unauthorized(''));
    return;
  }

  const secret = process.env.APP_SECRET ?? '';
  const token = authHeader.split(' ')[1];

  verify(token, secret, (err: any, user: any) => {
    if (err) {
      next(new Forbidden());
      return;
    }

    if (options?.roles
        && !options.roles.every(role => (user as unknown as IUser).roles.includes(role))) {
      next(new Forbidden('Missing authorization'));
    }

    (req as any).user = user;
    handler(req, res, next);
  });
};
