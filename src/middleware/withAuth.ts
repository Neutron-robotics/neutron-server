import {
  RequestHandler, Request, Response, NextFunction
} from 'express';
import { verify } from 'jsonwebtoken';
import { IUser, UserRole } from '../models/User';
import { Forbidden, Unauthorized } from '../errors/bad-request';

function isRoleAllowed(role: UserRole, userRole: UserRole): boolean {
  const permissionLevels: UserRole[] = [
    UserRole.User,
    UserRole.Verified,
    UserRole.Admin
  ];

  const permissionIndex = permissionLevels.indexOf(role);
  if (permissionIndex === -1) {
    return false;
  }

  const roleIndex = permissionLevels.indexOf(userRole);
  if (roleIndex === -1) {
    return false;
  }

  return roleIndex >= permissionIndex;
}

interface AuthOptions {
    role?: UserRole
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

    if (options?.role && !isRoleAllowed(options.role, user.role)) {
      next(new Forbidden('Missing authorization'));
      return;
    }

    (req as any).user = user;
    handler(req, res, next);
  });
};
