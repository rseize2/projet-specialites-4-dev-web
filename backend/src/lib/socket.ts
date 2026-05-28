import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { env } from '../config/env';
import { registerDocumentGateway } from '../gateways/documents.gateway';
import { registerChatGateway } from '../gateways/chat.gateway';
import { registerCallGateway } from '../gateways/call.gateway';
import { authSocket } from '../sockets/auth.socket';

let io: Server;

export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
  });

  // Auth JWT obligatoire pour toutes les connexions Socket.io
  io.use(authSocket);

  registerDocumentGateway(io);
  registerChatGateway(io);
  registerCallGateway(io);
}

export function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
