import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticator } from 'otplib';

vi.mock('../lib/prisma', () => ({
  prisma: { user: { findUnique: vi.fn(), update: vi.fn() } },
}));
vi.mock('../config/env', () => ({
  env: { JWT_SECRET: 'test-secret-test-secret', JWT_EXPIRES_IN: '7d' },
}));

import { prisma } from '../lib/prisma';
import * as twoFactor from '../services/twoFactor.service';

const findUnique = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>;
const update = prisma.user.update as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

describe('2FA', () => {
  it('enable génère un secret et un QR code', async () => {
    findUnique.mockResolvedValueOnce({ id: 'x', email: 'a@a.com', twoFactorEnabled: false });
    update.mockResolvedValueOnce({});
    const res = await twoFactor.enable('x');
    expect(res.secret).toBeTruthy();
    expect(res.qrCode).toMatch(/^data:image\/png/);
  });

  it('verify refuse un code invalide', async () => {
    findUnique.mockResolvedValueOnce({
      id: 'x',
      twoFactorSecret: authenticator.generateSecret(),
      twoFactorEnabled: false,
      role: 'USER',
    });
    await expect(twoFactor.verify('x', '000000')).rejects.toThrow();
  });

  it('verify accepte un code valide et active la 2FA', async () => {
    const secret = authenticator.generateSecret();
    findUnique.mockResolvedValueOnce({
      id: 'x',
      twoFactorSecret: secret,
      twoFactorEnabled: false,
      role: 'USER',
    });
    update.mockResolvedValueOnce({});
    const code = authenticator.generate(secret);
    const res = await twoFactor.verify('x', code);
    expect(res.twoFactorEnabled).toBe(true);
  });
});
