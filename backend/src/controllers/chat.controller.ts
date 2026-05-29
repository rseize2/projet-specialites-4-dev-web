import { Response, NextFunction } from 'express';
import * as chatService from '../services/chat.service';
import type { AuthRequest } from '../middlewares/auth';

export const listMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await chatService.listMessages(
      req.user!.sub,
      req.params.id as string,
      req.query as never,
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
};
