import { Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import type { AuthRequest } from '../middlewares/auth';

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await userService.getMe(req.user!.sub);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await userService.updateMe(req.user!.sub, req.body);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};
