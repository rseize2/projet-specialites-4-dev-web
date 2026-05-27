import { prisma } from '../lib/prisma';
import { HttpError } from '../middlewares/error';
import type { CreateDocumentInput } from '../schemas/documents.schema';

// champs renvoyés au client — on n'expose pas le contenu dans la liste
const documentListSelect = {
  id: true,
  title: true,
  ownerId: true,
  updatedAt: true,
  updatedBy: true,
  owner: { select: { id: true, firstName: true, lastName: true } },
  updatedByUser: { select: { id: true, firstName: true, lastName: true } },
};

export const list = async (userId: string) => {
  return prisma.document.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { invites: { some: { userId } } },
      ],
    },
    select: documentListSelect,
    orderBy: { updatedAt: 'desc' },
  });
};

export const create = async (userId: string, input: CreateDocumentInput) => {
  return prisma.document.create({
    data: {
      title: input.title,
      content: input.content ?? '',
      ownerId: userId,
      updatedBy: userId,
    },
    select: documentListSelect,
  });
};

export const remove = async (userId: string, documentId: string) => {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });

  if (!doc) {
    throw new HttpError(404, 'DOCUMENT_NOT_FOUND', 'Document introuvable');
  }
  if (doc.ownerId !== userId) {
    throw new HttpError(403, 'FORBIDDEN', 'Seul le propriétaire peut supprimer ce document');
  }

  await prisma.document.delete({ where: { id: documentId } });
};
