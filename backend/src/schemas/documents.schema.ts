import { z } from 'zod';

export const createDocumentSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
});

export const inviteSchema = z.object({
  email: z.string().email(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;
