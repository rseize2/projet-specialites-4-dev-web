import { Server, Socket } from 'socket.io';
import { assertDocumentAccess } from '../services/chat.service';
import { getSocketUser } from '../sockets/auth.socket';
import { prisma } from '../lib/prisma';

/**
 * Gateway de signalisation WebRTC pour les appels multi-utilisateurs.
 *
 * Architecture : mesh P2P. Chaque client établit une RTCPeerConnection
 * avec chaque autre participant. Le serveur ne fait que relayer
 * les offer/answer/ice-candidate entre les clients.
 *
 * Rooms : "call:<documentId>" — séparées des rooms doc/chat.
 *
 * Events client → serveur :
 *  - call:join   { documentId }
 *  - call:leave  { documentId }
 *  - call:signal { documentId, to: socketId, kind: 'offer'|'answer'|'ice', data }
 *
 * Events serveur → client :
 *  - call:participants     { participants: [{ socketId, user }] }
 *  - call:participant-joined { socketId, user }
 *  - call:participant-left   { socketId }
 *  - call:signal           { from: socketId, kind, data }
 */

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

    // récupère prénom/nom depuis la BDD pour les afficher dans l'appel
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
    // stocker pour que les autres puissent lire via fetchSockets()
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

        // récupérer les participants actuels (avant de rejoindre)
        const existing = await io.in(room).fetchSockets();
        const participants = existing.map((s) => ({
          socketId: s.id,
          user: (s.data as { profile?: typeof publicUser }).profile ?? null,
        }));

        socket.join(room);
        ack?.({ ok: true });

        // envoyer à l'arrivant la liste des participants déjà en place
        socket.emit('call:participants', { participants });

        // prévenir les autres déjà dans l'appel
        socket.to(room).emit('call:participant-joined', {
          socketId: socket.id,
          user: publicUser,
        });

        // si c'est le PREMIER participant → un nouvel appel démarre.
        // Notifier TOUS les utilisateurs ayant accès au document (owner + invités),
        // même ceux qui ne sont pas dans la page du doc, via leur room personnelle.
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
            recipients.delete(user.sub); // pas à l'initiateur
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

        // si plus personne dans l'appel, signaler la fin (pour stopper l'animation)
        const remaining = await io.in(room).fetchSockets();
        if (remaining.length === 0) {
          await broadcastCallEnded(io, documentId);
        }
      }
    });

    // Relais simple : on transmet le signal au destinataire ciblé.
    // Aucune persistance — c'est éphémère.
    socket.on('call:signal', ({ to, kind, data, documentId }: SignalPayload) => {
      const room = callRoom(documentId);
      if (!socket.rooms.has(room)) return; // doit être dans la room
      io.to(to).emit('call:signal', {
        from: socket.id,
        kind,
        data,
      });
    });

    // nettoyage automatique : quitter toutes les rooms d'appel
    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (room.startsWith('call:')) {
          const documentId = room.slice(5);
          socket.to(room).emit('call:participant-left', { socketId: socket.id });

          // signaler la fin si c'était le dernier participant (le -1 car nous comptons dedans)
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
