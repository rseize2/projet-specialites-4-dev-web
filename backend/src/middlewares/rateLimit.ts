import rateLimit from 'express-rate-limit';

const rateLimitMessage = (code: string, message: string) => ({
  error: { code, message },
});

export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitMessage(
    'TOO_MANY_REQUESTS',
    'Trop de tentatives. Réessayez dans quelques minutes.',
  ),
});

export const twoFactorLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitMessage(
    'TOO_MANY_REQUESTS',
    'Trop de tentatives 2FA. Réessayez dans quelques minutes.',
  ),
});
