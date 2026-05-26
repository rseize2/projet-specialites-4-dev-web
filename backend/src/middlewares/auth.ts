import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { HttpError } from './error';

export interface AuthPayload {
  sub: string;
  role: 'USER' | 'ADMIN';
  twoFactorVerified?: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export const requireAuth = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new HttpError(401, 'NO_TOKEN', 'Missing authorization header'));
  }
  try {
    req.user = jwt.verify(header.slice(7), env.JWT_SECRET) as AuthPayload;
    next();
  } catch {
    next(new HttpError(401, 'INVALID_TOKEN', 'Invalid or expired token'));
  }
};

export const requireAdmin = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return next(new HttpError(403, 'FORBIDDEN', 'Admin role required'));
  }
  next();
};

export const require2FA = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user?.twoFactorVerified) {
    return next(new HttpError(401, '2FA_REQUIRED', 'Two-factor verification required'));
  }
  next();
};
