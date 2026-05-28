import { z } from 'zod';

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export const listMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  before: z.string().datetime().optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
