import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as filesService from '../services/files.service';

export const uploadFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { code: 'NO_FILE', message: 'Aucun fichier fourni' } });
    }
    const file = await filesService.upload(req.user!.sub, req.params.id as string, req.file);
    res.status(201).json({ data: file });
  } catch (err) {
    next(err);
  }
};

export const listFiles = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const files = await filesService.list(req.user!.sub, req.params.id as string);
    res.json({ data: files });
  } catch (err) {
    next(err);
  }
};

export const downloadFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const url = await filesService.getDownloadUrl(req.user!.sub, req.params.id as string, req.params.fileId as string);
    // redirige directement vers la presigned URL MinIO
    res.redirect(url);
  } catch (err) {
    next(err);
  }
};

export const deleteFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await filesService.remove(req.user!.sub, req.params.id as string, req.params.fileId as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
