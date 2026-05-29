import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { HttpError } from '../middlewares/error';
import type { AuthPayload } from '../middlewares/auth';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema';

const BCRYPT_ROUNDS = 10;

const signToken = (user: { id: string; role: 'USER' | 'ADMIN' }, twoFactorVerified = false) => {
  const payload: AuthPayload = {
    sub: user.id,
    role: user.role,
    twoFactorVerified,
  };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
};

const toPublicUser = (user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'ADMIN';
  twoFactorEnabled: boolean;
}) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role,
  twoFactorEnabled: user.twoFactorEnabled,
});

export const register = async (input: RegisterInput) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new HttpError(409, 'EMAIL_TAKEN', 'Cette adresse e-mail est déjà utilisée');
  }
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
    },
  });
  return {
    user: toPublicUser(user),
    token: signToken(user, true),
  };
};

export const login = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'E-mail ou mot de passe incorrect');
  }
  if (user.blocked) {
    throw new HttpError(403, 'ACCOUNT_BLOCKED', 'Ce compte est bloqué');
  }
  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'E-mail ou mot de passe incorrect');
  }
  return {
    user: toPublicUser(user),
    token: signToken(user, !user.twoFactorEnabled),
    twoFactorRequired: user.twoFactorEnabled,
  };
};
