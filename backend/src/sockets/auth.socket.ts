import jwt from 'jsonwebtoken';
import type { Socket } from 'socket.io';
import type { ExtendedError } from 'socket.io/dist/namespace';
import { env } from '../config/env';
import type { AuthPayload } from '../middlewares/auth';


declare module 'socket.io' {
  interface DefaultEventsMap {}
}

export interface SocketUser extends AuthPayload {}


export const authSocket = (socket: Socket, next: (err?: ExtendedError) => void) => {
  const token =
    (socket.handshake.auth?.token as string | undefined) ??
    (socket.handshake.query?.token as string | undefined);

  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    if (payload.twoFactorVerified) {
      (socket.data as { user?: SocketUser }).user = payload;
      socket.join(`user:${payload.sub}`);
    }
    next();
  } catch {
    next(new Error('INVALID_TOKEN'));
  }
};

export const getSocketUser = (socket: Socket): SocketUser | undefined =>
  (socket.data as { user?: SocketUser }).user;
