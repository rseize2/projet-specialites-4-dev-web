import bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/prisma', () => ({
  prisma: { user: { findUnique: vi.fn(), update: vi.fn() } },
}));

import { prisma } from '../lib/prisma';
import * as userService from '../services/user.service';

const findUnique = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>;
const update = prisma.user.update as unknown as ReturnType<typeof vi.fn>;

const baseUser = {
  id: 'uid',
  email: 'a@a.com',
  firstName: 'A',
  lastName: 'B',
  role: 'USER' as const,
  blocked: false,
  twoFactorEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => vi.clearAllMocks());

describe('user', () => {
  it('getMe renvoie le profil', async () => {
    findUnique.mockResolvedValueOnce(baseUser);
    const me = await userService.getMe('uid');
    expect(me.id).toBe('uid');
  });

  it('updateMe change le prénom', async () => {
    findUnique.mockResolvedValueOnce({ ...baseUser, password: 'hash' });
    update.mockResolvedValueOnce({ ...baseUser, firstName: 'Nouveau' });
    const res = await userService.updateMe('uid', { firstName: 'Nouveau' });
    expect(res.firstName).toBe('Nouveau');
  });

  it('updateMe refuse le changement de MDP si currentPassword est faux', async () => {
    const hash = await bcrypt.hash('correct', 12);
    findUnique.mockResolvedValueOnce({ ...baseUser, password: hash });
    await expect(
      userService.updateMe('uid', { currentPassword: 'mauvais', newPassword: 'nouveau123' }),
    ).rejects.toThrow();
  });
});
