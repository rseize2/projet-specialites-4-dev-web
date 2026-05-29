import { z } from 'zod';

export const inviteSchema = z.object({
  email: z.string().email(),
});

export type InviteInput = z.infer<typeof inviteSchema>;
