import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as inviteService from '../services/invite.service';

export const inviteCollaborator = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await inviteService.invite(req.user!.sub, req.params.id as string, req.body.email);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
};

export const removeCollaborator = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await inviteService.removeInvite(req.user!.sub, req.params.id as string, req.params.userId as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
