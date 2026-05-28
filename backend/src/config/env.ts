import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REDIS_URL: z.string().url().optional(),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
  MINIO_BUCKET: z.string().default('documents'),
  MINIO_USE_SSL: z.string().transform(v => v === 'true').default('false'),
});

export const env = schema.parse(process.env);
