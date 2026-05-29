import { Response, NextFunction } from 'express';
import * as adminService from '../services/admin.service';
import type { AuthRequest } from '../middlewares/auth';

export const listUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await adminService.listUsers(req.query as never);
    res.json({ data });
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await adminService.createUser(req.body);
    res.status(201).json({ data: user });
  } catch (err) {
    next(err);
  }
};

export const blockUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await adminService.blockUser(req.params.id as string, req.user!.sub);
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
};

export const unblockUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await adminService.unblockUser(req.params.id as string, req.user!.sub);
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.deleteUser(req.params.id as string, req.user!.sub);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
};
