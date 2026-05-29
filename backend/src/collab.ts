import { Server } from '@hocuspocus/server';
import * as Y from 'yjs';
import jwt from 'jsonwebtoken';
import { prisma } from './lib/prisma';
import { env } from './config/env';
import type { AuthPayload } from './middlewares/auth';

export const collabServer = new Server({
  port: 4000,

  async onAuthenticate(data: { token: string; context: Record<string, unknown> }) {
    try {
      const payload = jwt.verify(data.token, env.JWT_SECRET) as AuthPayload;
      data.context.userId = payload.sub;
      data.context.role = payload.role;
    } catch {
      throw new Error('Token invalide');
    }
  },

  async onLoadDocument(data: { documentName: string; document: Y.Doc; context: Record<string, unknown> }) {
    const userId = data.context.userId as string;

    const doc = await prisma.document.findUnique({
      where: { id: data.documentName },
      include: { invites: { where: { userId } } },
    });

    if (!doc) throw new Error('Document introuvable');
    if (doc.ownerId !== userId && doc.invites.length === 0) {
      throw new Error('Accès refusé');
    }

    if (doc.yjsState) {
      Y.applyUpdate(data.document, doc.yjsState);
    }
  },

  async onStoreDocument(data: { documentName: string; document: Y.Doc }) {
    const state = Y.encodeStateAsUpdate(data.document);
    await prisma.document.update({
      where: { id: data.documentName },
      data: { yjsState: Buffer.from(state) },
    });
  },

  async onConnect(data: { documentName: string; context: Record<string, unknown> }) {
    console.log(`[collab] ${data.context.userId} a rejoint ${data.documentName}`);
  },
});
