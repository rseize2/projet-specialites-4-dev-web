import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  createDocumentSchema,
  inviteSchema,
  updateDocumentSchema,
} from '../schemas/documents.schema';
import * as documentsController from '../controllers/documents.controller';
import * as filesController from '../controllers/files.controller';
import * as exportController from '../controllers/export.controller';
import * as chatController from '../controllers/chat.controller';
import { listMessagesQuerySchema } from '../schemas/chat.schema';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, 
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.use(requireAuth);

router.get('/', documentsController.getDocuments);
router.post('/', validate(createDocumentSchema), documentsController.createDocument);
router.get('/:id', documentsController.getDocument);
router.put('/:id', validate(updateDocumentSchema), documentsController.updateDocument);
router.delete('/:id', documentsController.deleteDocument);

router.post('/:id/invite', validate(inviteSchema), documentsController.inviteCollaborator);

router.post('/:id/files', upload.single('file'), filesController.uploadFile);
router.get('/:id/files', filesController.listFiles);
router.get('/:id/files/:fileId', filesController.downloadFile);
router.delete('/:id/files/:fileId', filesController.deleteFile);

router.get('/:id/export', exportController.exportDocument);

router.get('/:id/messages', validate(listMessagesQuerySchema, 'query'), chatController.listMessages);

export default router;
