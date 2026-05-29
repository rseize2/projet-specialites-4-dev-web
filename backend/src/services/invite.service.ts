import { prisma } from '../lib/prisma';
import { HttpError } from '../middlewares/error';

export const invite = async (ownerId: string, documentId: string, email: string) => {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new HttpError(404, 'DOCUMENT_NOT_FOUND', 'Document introuvable');
  if (doc.ownerId !== ownerId) {
    throw new HttpError(403, 'FORBIDDEN', 'Seul le propriétaire peut inviter des collaborateurs');
  }

  const target = await prisma.user.findUnique({ where: { email } });
  if (!target) throw new HttpError(404, 'USER_NOT_FOUND', 'Aucun compte avec cet email');
  if (target.id === ownerId) {
    throw new HttpError(400, 'CANNOT_INVITE_SELF', 'Vous êtes déjà propriétaire de ce document');
  }

  const existing = await prisma.documentInvite.findUnique({
    where: { documentId_userId: { documentId, userId: target.id } },
  });
  if (existing) return existing;

  return prisma.documentInvite.create({
    data: { documentId, userId: target.id },
  });
};

export const removeInvite = async (ownerId: string, documentId: string, userId: string) => {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new HttpError(404, 'DOCUMENT_NOT_FOUND', 'Document introuvable');
  if (doc.ownerId !== ownerId) {
    throw new HttpError(403, 'FORBIDDEN', 'Seul le propriétaire peut retirer une invitation');
  }

  await prisma.documentInvite.deleteMany({ where: { documentId, userId } });
};
