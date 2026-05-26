import { Server, Socket } from 'socket.io';

interface JoinPayload {
  documentId: string;
}

interface UpdatePayload {
  documentId: string;
  content: string;
}

// chaque document a sa propre room : "doc:<documentId>"
function roomId(documentId: string) {
  return `doc:${documentId}`;
}

export function registerDocumentGateway(io: Server) {
  io.on('connection', (socket: Socket) => {
    // en standalone, on accepte un userId en query param
    // quand l'auth JWT sera prête, ce sera remplacé par req.user.sub
    const userId = (socket.handshake.query.userId as string) ?? socket.id;

    socket.on('join-doc', ({ documentId }: JoinPayload) => {
      socket.join(roomId(documentId));
      // prévenir les autres qu'un nouvel utilisateur a rejoint
      socket.to(roomId(documentId)).emit('user-joined', { documentId, userId });
    });

    socket.on('leave-doc', ({ documentId }: JoinPayload) => {
      socket.leave(roomId(documentId));
      socket.to(roomId(documentId)).emit('user-left', { documentId, userId });
    });

    socket.on('doc-update', ({ documentId, content }: UpdatePayload) => {
      // on broadcast aux autres clients de la room, pas à l'émetteur
      socket.to(roomId(documentId)).emit('doc-update', {
        documentId,
        content,
        updatedBy: userId,
      });
    });

    // nettoyage automatique si le client se déconnecte sans leave-doc explicite
    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (room.startsWith('doc:')) {
          const documentId = room.slice(4);
          socket.to(room).emit('user-left', { documentId, userId });
        }
      }
    });
  });
}
