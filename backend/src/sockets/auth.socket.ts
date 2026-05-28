import jwt from 'jsonwebtoken';
import type { Socket } from 'socket.io';
import type { ExtendedError } from 'socket.io/dist/namespace';
import { env } from '../config/env';
import type { AuthPayload } from '../middlewares/auth';

/**
 * Étend la SocketData par défaut de Socket.io avec un user optionnel.
 */
declare module 'socket.io' {
  interface DefaultEventsMap {}
}

export interface SocketUser extends AuthPayload {}

/**
 * Middleware d'authentification Socket.io permissif :
 *  - si un token est fourni et valide → attache user à socket.data.user
 *  - si pas de token → la connexion passe (socket.data.user = undefined)
 *  - si token présent mais invalide → rejet
 *
 * Les gateways qui exigent un user (chat, appels) doivent vérifier
 * `socket.data.user` et ignorer la connexion sinon.
 */
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
      // Room personnelle pour les notifs ciblées (appels entrants, etc.)
      socket.join(`user:${payload.sub}`);
    }
    next();
  } catch {
    next(new Error('INVALID_TOKEN'));
  }
};

export const getSocketUser = (socket: Socket): SocketUser | undefined =>
  (socket.data as { user?: SocketUser }).user;
