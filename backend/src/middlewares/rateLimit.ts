import rateLimit from 'express-rate-limit';

const rateLimitMessage = (code: string, message: string) => ({
  error: { code, message },
});

/**
 * Limite générique des endpoints sensibles d'authentification.
 * 5 tentatives par IP toutes les 5 minutes.
 */
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

/**
 * Limite spécifique pour la vérification 2FA (un peu plus stricte).
 * 10 tentatives par IP toutes les 5 minutes.
 */
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
