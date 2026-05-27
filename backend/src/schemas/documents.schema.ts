import { z } from 'zod';

export const createDocumentSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
