import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { HttpError } from '../middlewares/error';
import type { UpdateMeInput } from '../schemas/user.schema';

const BCRYPT_ROUNDS = 12;

const publicFields = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  blocked: true,
  twoFactorEnabled: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicFields,
  });
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'Utilisateur introuvable');
  return user;
};

export const updateMe = async (userId: string, input: UpdateMeInput) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'Utilisateur introuvable');

  const data: Record<string, unknown> = {};

  if (input.email && input.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new HttpError(409, 'EMAIL_TAKEN', 'Cette adresse e-mail est déjà utilisée');
    data.email = input.email;
  }

  if (input.firstName) data.firstName = input.firstName;
  if (input.lastName) data.lastName = input.lastName;

  if (input.newPassword) {
    const valid = await bcrypt.compare(input.currentPassword!, user.password);
    if (!valid) {
      throw new HttpError(401, 'INVALID_CURRENT_PASSWORD', 'Mot de passe actuel incorrect');
    }
    data.password = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: publicFields,
  });
  return updated;
};
