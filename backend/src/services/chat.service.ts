import { prisma } from '../lib/prisma';
import { HttpError } from '../middlewares/error';
import type { ListMessagesQuery, SendMessageInput } from '../schemas/chat.schema';

const messageSelect = {
  id: true,
  documentId: true,
  content: true,
  createdAt: true,
  user: { select: { id: true, firstName: true, lastName: true } },
} as const;


export const assertDocumentAccess = async (userId: string, documentId: string) => {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      ownerId: true,
      invites: { where: { userId }, select: { id: true } },
    },
  });
  if (!doc) throw new HttpError(404, 'DOCUMENT_NOT_FOUND', 'Document introuvable');
  if (doc.ownerId !== userId && doc.invites.length === 0) {
    throw new HttpError(403, 'FORBIDDEN', 'Accès refusé à ce document');
  }
};

export const listMessages = async (
  userId: string,
  documentId: string,
  { limit, before }: ListMessagesQuery,
) => {
  await assertDocumentAccess(userId, documentId);

  const messages = await prisma.message.findMany({
    where: {
      documentId,
      ...(before ? { createdAt: { lt: new Date(before) } } : {}),
    },
    select: messageSelect,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return messages.reverse();
};

export const createMessage = async (
  userId: string,
  documentId: string,
  input: SendMessageInput,
) => {
  await assertDocumentAccess(userId, documentId);

  return prisma.message.create({
    data: {
      documentId,
      userId,
      content: input.content,
    },
    select: messageSelect,
  });
};
