import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { s3 } from '../lib/minio';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { HttpError } from '../middlewares/error';

// vérifie que l'utilisateur a accès au document (owner ou invité)
async function checkAccess(userId: string, documentId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { invites: { where: { userId } } },
  });
  if (!doc) throw new HttpError(404, 'DOCUMENT_NOT_FOUND', 'Document introuvable');
  if (doc.ownerId !== userId && doc.invites.length === 0) {
    throw new HttpError(403, 'FORBIDDEN', 'Accès refusé');
  }
  return doc;
}

export const upload = async (
  userId: string,
  documentId: string,
  file: Express.Multer.File,
) => {
  await checkAccess(userId, documentId);

  // clé unique dans le bucket : documentId/uuid-filename
  const storageKey = `${documentId}/${randomUUID()}-${file.originalname}`;

  await s3.send(new PutObjectCommand({
    Bucket: env.MINIO_BUCKET,
    Key: storageKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));

  return prisma.documentFile.create({
    data: {
      documentId,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storageKey,
      uploadedBy: userId,
    },
  });
};

export const list = async (userId: string, documentId: string) => {
  await checkAccess(userId, documentId);
  return prisma.documentFile.findMany({
    where: { documentId },
    orderBy: { createdAt: 'desc' },
  });
};

export const getDownloadUrl = async (userId: string, documentId: string, fileId: string) => {
  await checkAccess(userId, documentId);

  const file = await prisma.documentFile.findUnique({ where: { id: fileId } });
  if (!file || file.documentId !== documentId) {
    throw new HttpError(404, 'FILE_NOT_FOUND', 'Fichier introuvable');
  }

  // presigned URL valable 15 minutes
  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: env.MINIO_BUCKET, Key: file.storageKey }),
    { expiresIn: 900 },
  );

  return url;
};

export const remove = async (userId: string, documentId: string, fileId: string) => {
  const doc = await checkAccess(userId, documentId);

  if (doc.ownerId !== userId) {
    throw new HttpError(403, 'FORBIDDEN', 'Seul le propriétaire peut supprimer des fichiers');
  }

  const file = await prisma.documentFile.findUnique({ where: { id: fileId } });
  if (!file || file.documentId !== documentId) {
    throw new HttpError(404, 'FILE_NOT_FOUND', 'Fichier introuvable');
  }

  await s3.send(new DeleteObjectCommand({ Bucket: env.MINIO_BUCKET, Key: file.storageKey }));
  await prisma.documentFile.delete({ where: { id: fileId } });
};
