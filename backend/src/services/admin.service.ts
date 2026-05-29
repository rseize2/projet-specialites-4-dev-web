import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { HttpError } from '../middlewares/error';
import type { CreateUserInput, ListUsersQuery } from '../schemas/admin.schema';

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

export const listUsers = async ({ page, pageSize, search }: ListUsersQuery) => {
  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: publicFields,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    users,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
};

export const createUser = async (input: CreateUserInput) => {
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
      role: input.role,
    },
    select: publicFields,
  });
  return user;
};

const setBlocked = async (id: string, blocked: boolean, currentAdminId: string) => {
  if (id === currentAdminId) {
    throw new HttpError(400, 'CANNOT_MODIFY_SELF', 'Vous ne pouvez pas modifier votre propre compte');
  }
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'Utilisateur introuvable');
  return prisma.user.update({
    where: { id },
    data: { blocked },
    select: publicFields,
  });
};

export const blockUser = (id: string, currentAdminId: string) =>
  setBlocked(id, true, currentAdminId);

export const unblockUser = (id: string, currentAdminId: string) =>
  setBlocked(id, false, currentAdminId);

export const deleteUser = async (id: string, currentAdminId: string) => {
  if (id === currentAdminId) {
    throw new HttpError(400, 'CANNOT_MODIFY_SELF', 'Vous ne pouvez pas supprimer votre propre compte');
  }
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'Utilisateur introuvable');
  await prisma.user.delete({ where: { id } });
  return { success: true };
};
