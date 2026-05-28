import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { exportPdf } from '../services/export.service';

export const exportDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { format } = req.query;

    if (format !== 'pdf') {
      return res.status(400).json({ error: { code: 'UNSUPPORTED_FORMAT', message: 'Seul le format pdf est supporté' } });
    }

    const pdf = await exportPdf(req.user!.sub, req.params.id as string);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="document-${req.params.id}.pdf"`);
    res.send(pdf);
  } catch (err) {
    next(err);
  }
};
