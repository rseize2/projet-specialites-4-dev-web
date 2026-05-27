import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createDocumentSchema, updateDocumentSchema } from '../schemas/documents.schema';
import * as documentsController from '../controllers/documents.controller';

const router = Router();

router.use(requireAuth);

router.get('/', documentsController.getDocuments);
router.post('/', validate(createDocumentSchema), documentsController.createDocument);
router.get('/:id', documentsController.getDocument);
router.put('/:id', validate(updateDocumentSchema), documentsController.updateDocument);
router.delete('/:id', documentsController.deleteDocument);

export default router;
