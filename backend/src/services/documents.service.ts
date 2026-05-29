import { prisma } from '../lib/prisma';
import { HttpError } from '../middlewares/error';
import type {
  CreateDocumentInput,
  InviteInput,
  UpdateDocumentInput,
} from '../schemas/documents.schema';

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

const checkAccess = async (userId: string, documentId: string) => {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { invites: { where: { userId } } },
  });
  if (!doc) throw new HttpError(404, 'DOCUMENT_NOT_FOUND', 'Document introuvable');
  if (doc.ownerId !== userId && doc.invites.length === 0) {
    throw new HttpError(403, 'FORBIDDEN', 'Accès refusé');
  }
  return doc;
};

export const getOne = async (userId: string, documentId: string) => {
  const doc = await checkAccess(userId, documentId);
  return doc;
};

export const update = async (userId: string, documentId: string, input: UpdateDocumentInput) => {
  await checkAccess(userId, documentId);

  return prisma.document.update({
    where: { id: documentId },
    data: {
      ...input,
      updatedBy: userId,
    },
  });
};

export const invite = async (userId: string, documentId: string, input: InviteInput) => {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new HttpError(404, 'DOCUMENT_NOT_FOUND', 'Document introuvable');
  if (doc.ownerId !== userId) {
    throw new HttpError(403, 'FORBIDDEN', 'Seul le propriétaire peut inviter des collaborateurs');
  }

  const invitee = await prisma.user.findUnique({ where: { email: input.email } });
  if (!invitee) {
    throw new HttpError(404, 'USER_NOT_FOUND', "Aucun utilisateur n'a cette adresse e-mail");
  }
  if (invitee.id === userId) {
    throw new HttpError(400, 'CANNOT_INVITE_SELF', 'Vous ne pouvez pas vous inviter vous-même');
  }

  await prisma.documentInvite.upsert({
    where: { documentId_userId: { documentId, userId: invitee.id } },
    update: {},
    create: { documentId, userId: invitee.id },
  });

  return {
    user: {
      id: invitee.id,
      email: invitee.email,
      firstName: invitee.firstName,
      lastName: invitee.lastName,
    },
  };
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
