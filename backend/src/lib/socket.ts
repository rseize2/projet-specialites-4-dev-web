import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { env } from '../config/env';
import { registerDocumentGateway } from '../gateways/documents.gateway';

let io: Server;

export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
  });

  registerDocumentGateway(io);
}

export function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
