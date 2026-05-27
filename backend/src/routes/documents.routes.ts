import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createDocumentSchema } from '../schemas/documents.schema';
import * as documentsController from '../controllers/documents.controller';

const router = Router();

router.use(requireAuth);

router.get('/', documentsController.getDocuments);
router.post('/', validate(createDocumentSchema), documentsController.createDocument);
router.delete('/:id', documentsController.deleteDocument);

export default router;
