import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as documentsService from '../services/documents.service';

export const getDocuments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const docs = await documentsService.list(req.user!.sub);
    res.json({ data: docs });
  } catch (err) {
    next(err);
  }
};

export const createDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const doc = await documentsService.create(req.user!.sub, req.body);
    res.status(201).json({ data: doc });
  } catch (err) {
    next(err);
  }
};

export const getDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const doc = await documentsService.getOne(req.user!.sub, req.params.id as string);
    res.json({ data: doc });
  } catch (err) {
    next(err);
  }
};

export const updateDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const doc = await documentsService.update(req.user!.sub, req.params.id as string, req.body);
    res.json({ data: doc });
  } catch (err) {
    next(err);
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await documentsService.remove(req.user!.sub, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
