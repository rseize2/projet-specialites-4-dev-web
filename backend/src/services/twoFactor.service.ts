import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { HttpError } from '../middlewares/error';
import type { AuthPayload } from '../middlewares/auth';

const APP_NAME = 'Projet Spé 4';

const signToken = (user: { id: string; role: 'USER' | 'ADMIN' }, twoFactorVerified: boolean) => {
  const payload: AuthPayload = {
    sub: user.id,
    role: user.role,
    twoFactorVerified,
  };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
};


export const enable = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'Utilisateur introuvable');
  if (user.twoFactorEnabled) {
    throw new HttpError(409, '2FA_ALREADY_ENABLED', 'La 2FA est déjà activée');
  }

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(user.email, APP_NAME, secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret },
  });

  return { secret, qrCode: qrCodeDataUrl, otpauth };
};

export const verify = async (userId: string, code: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'Utilisateur introuvable');
  if (!user.twoFactorSecret) {
    throw new HttpError(400, '2FA_NOT_INITIALIZED', 'La 2FA n’a pas été initialisée');
  }

  const valid = authenticator.check(code, user.twoFactorSecret);
  if (!valid) throw new HttpError(401, 'INVALID_2FA_CODE', 'Code 2FA invalide');

  if (!user.twoFactorEnabled) {
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
  }

  return {
    token: signToken(user, true),
    twoFactorEnabled: true,
  };
};


export const disable = async (userId: string, code: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'Utilisateur introuvable');
  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    throw new HttpError(409, '2FA_NOT_ENABLED', 'La 2FA n’est pas activée');
  }

  const valid = authenticator.check(code, user.twoFactorSecret);
  if (!valid) throw new HttpError(401, 'INVALID_2FA_CODE', 'Code 2FA invalide');

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });

  return { twoFactorEnabled: false };
};
