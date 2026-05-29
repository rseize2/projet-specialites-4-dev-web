import { Server, Socket } from 'socket.io';

interface JoinPayload {
  documentId: string;
}

interface UpdatePayload {
  documentId: string;
  content: string;
}

function roomId(documentId: string) {
  return `doc:${documentId}`;
}

export function registerDocumentGateway(io: Server) {
  io.on('connection', (socket: Socket) => {
    const userId = (socket.handshake.query.userId as string) ?? socket.id;

    socket.on('join-doc', ({ documentId }: JoinPayload) => {
      socket.join(roomId(documentId));
      socket.to(roomId(documentId)).emit('user-joined', { documentId, userId });
    });

    socket.on('leave-doc', ({ documentId }: JoinPayload) => {
      socket.leave(roomId(documentId));
      socket.to(roomId(documentId)).emit('user-left', { documentId, userId });
    });

    socket.on('doc-update', ({ documentId, content }: UpdatePayload) => {
      socket.to(roomId(documentId)).emit('doc-update', {
        documentId,
        content,
        updatedBy: userId,
      });
    });

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
