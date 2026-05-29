import { Server, Socket } from 'socket.io';
import { assertDocumentAccess } from '../services/chat.service';
import { getSocketUser } from '../sockets/auth.socket';
import { prisma } from '../lib/prisma';

const callRoom = (documentId: string) => `call:${documentId}`;
const docRoom = (documentId: string) => `doc:${documentId}`;

async function broadcastCallEnded(io: Server, documentId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { ownerId: true, invites: { select: { userId: true } } },
  });
  if (!doc) return;
  const recipients = new Set<string>([
    doc.ownerId,
    ...doc.invites.map((i) => i.userId),
  ]);
  const payload = { documentId };
  for (const userId of recipients) {
    io.to(`user:${userId}`).emit('call:ended', payload);
  }
}

interface JoinPayload {
  documentId: string;
}
interface SignalPayload {
  documentId: string;
  to: string;
  kind: 'offer' | 'answer' | 'ice';
  data: unknown;
}

export function registerCallGateway(io: Server) {
  io.on('connection', async (socket: Socket) => {
    const user = getSocketUser(socket);
    if (!user) return;

    const userRecord = await prisma.user.findUnique({
      where: { id: user.sub },
      select: { firstName: true, lastName: true },
    });
    const publicUser = {
      id: user.sub,
      role: user.role,
      firstName: userRecord?.firstName ?? '',
      lastName: userRecord?.lastName ?? '',
    };
    (socket.data as { profile?: typeof publicUser }).profile = publicUser;

    socket.on(
      'call:join',
      async ({ documentId }: JoinPayload, ack?: (resp: { ok: boolean; error?: string }) => void) => {
        try {
          await assertDocumentAccess(user.sub, documentId);
        } catch (err: unknown) {
          const code =
            err && typeof err === 'object' && 'code' in err ? String((err as any).code) : 'ERROR';
          ack?.({ ok: false, error: code });
          return;
        }

        const room = callRoom(documentId);

        const existing = await io.in(room).fetchSockets();
        const participants = existing.map((s) => ({
          socketId: s.id,
          user: (s.data as { profile?: typeof publicUser }).profile ?? null,
        }));

        socket.join(room);
        ack?.({ ok: true });

        socket.emit('call:participants', { participants });

        socket.to(room).emit('call:participant-joined', {
          socketId: socket.id,
          user: publicUser,
        });


        if (existing.length === 0) {
          const doc = await prisma.document.findUnique({
            where: { id: documentId },
            select: {
              title: true,
              ownerId: true,
              invites: { select: { userId: true } },
            },
          });
          if (doc) {
            const recipients = new Set<string>([
              doc.ownerId,
              ...doc.invites.map((i) => i.userId),
            ]);
            recipients.delete(user.sub); 
            const payload = {
              documentId,
              documentTitle: doc.title,
              by: publicUser,
            };
            for (const userId of recipients) {
              io.to(`user:${userId}`).emit('call:started', payload);
            }
          }
        }
      },
    );

    socket.on('call:leave', async ({ documentId }: JoinPayload) => {
      const room = callRoom(documentId);
      if (socket.rooms.has(room)) {
        socket.leave(room);
        socket.to(room).emit('call:participant-left', { socketId: socket.id });

        const remaining = await io.in(room).fetchSockets();
        if (remaining.length === 0) {
          await broadcastCallEnded(io, documentId);
        }
      }
    });


    socket.on('call:signal', ({ to, kind, data, documentId }: SignalPayload) => {
      const room = callRoom(documentId);
      if (!socket.rooms.has(room)) return;
      io.to(to).emit('call:signal', {
        from: socket.id,
        kind,
        data,
      });
    });

    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (room.startsWith('call:')) {
          const documentId = room.slice(5);
          socket.to(room).emit('call:participant-left', { socketId: socket.id });

          setTimeout(async () => {
            const remaining = await io.in(room).fetchSockets();
            if (remaining.length === 0) {
              await broadcastCallEnded(io, documentId);
            }
          }, 100);
        }
      }
    });
  });
}
