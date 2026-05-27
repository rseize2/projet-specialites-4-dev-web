import { z } from 'zod';

export const updateMeSchema = z
  .object({
    email: z.string().email().optional(),
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    currentPassword: z.string().min(1).optional(),
    newPassword: z.string().min(8).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ doit être renseigné',
  })
  .refine(
    (data) => !data.newPassword || data.currentPassword,
    { message: 'Le mot de passe actuel est requis pour changer de mot de passe', path: ['currentPassword'] },
  );

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
