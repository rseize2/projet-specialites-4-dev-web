import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/prisma', () => ({
  prisma: { user: { findUnique: vi.fn(), create: vi.fn() } },
}));
vi.mock('../config/env', () => ({
  env: { JWT_SECRET: 'test-secret-test-secret', JWT_EXPIRES_IN: '7d' },
}));

import { prisma } from '../lib/prisma';
import * as authService from '../services/auth.service';

const findUnique = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>;
const create = prisma.user.create as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

describe('auth', () => {
  it('refuse register si email déjà pris', async () => {
    findUnique.mockResolvedValueOnce({ id: 'x' });
    await expect(
      authService.register({
        email: 'a@a.com',
        password: 'password123',
        firstName: 'A',
        lastName: 'B',
      }),
    ).rejects.toThrow();
  });

  it('refuse login si user inconnu', async () => {
    findUnique.mockResolvedValueOnce(null);
    await expect(
      authService.login({ email: 'nope@a.com', password: 'xxx' }),
    ).rejects.toThrow();
  });

  it('register hash le mot de passe', async () => {
    findUnique.mockResolvedValueOnce(null);
    create.mockImplementationOnce(async ({ data }: any) => ({
      id: 'uid',
      ...data,
      role: 'USER',
      blocked: false,
      twoFactorEnabled: false,
    }));
    await authService.register({
      email: 'a@a.com',
      password: 'password123',
      firstName: 'A',
      lastName: 'B',
    });
    const stored = create.mock.calls[0][0].data.password;
    expect(stored).not.toBe('password123');
  });
});
