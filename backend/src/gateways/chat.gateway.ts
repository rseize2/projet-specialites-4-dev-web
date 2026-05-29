import { Server, Socket } from 'socket.io';
import * as chatService from '../services/chat.service';
import { sendMessageSchema } from '../schemas/chat.schema';
import { getSocketUser } from '../sockets/auth.socket';

const roomId = (documentId: string) => `doc:${documentId}`;

interface SendPayload {
  documentId: string;
  content: string;
}

export function registerChatGateway(io: Server) {
  io.on('connection', (socket: Socket) => {
    const user = getSocketUser(socket);
    if (!user) return; 

    socket.on(
      'chat:send',
      async (payload: SendPayload, ack?: (resp: { ok: boolean; error?: string }) => void) => {
        const parsed = sendMessageSchema.safeParse({ content: payload?.content });
        if (!parsed.success) {
          ack?.({ ok: false, error: 'VALIDATION_ERROR' });
          return;
        }
        try {
          const message = await chatService.createMessage(
            user.sub,
            payload.documentId,
            parsed.data,
          );
          io.to(roomId(payload.documentId)).emit('chat:message', message);
          ack?.({ ok: true });
        } catch (err: unknown) {
          const code =
            err && typeof err === 'object' && 'code' in err ? String((err as any).code) : 'ERROR';
          ack?.({ ok: false, error: code });
        }
      },
    );
  });
}
