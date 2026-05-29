import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import * as twoFactorService from '../services/twoFactor.service';
import type { AuthRequest } from '../middlewares/auth';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await authService.register(req.body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await authService.login(req.body);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const logout = (_req: AuthRequest, res: Response) => {
  res.json({ data: { success: true } });
};

export const enable2FA = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await twoFactorService.enable(req.user!.sub);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const verify2FA = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await twoFactorService.verify(req.user!.sub, req.body.code);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const disable2FA = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await twoFactorService.disable(req.user!.sub, req.body.code);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};
