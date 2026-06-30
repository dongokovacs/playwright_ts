import { z } from 'zod';

// strictObject(): reject unknown fields, same contract-testing philosophy as ArticleSchema
export const UserSchema = z.strictObject({
  email: z.string().email(),
  token: z.string().min(1),
  username: z.string().min(1),
  bio: z.string().nullable(),
  image: z.string().nullable(),
});

export const UserResponseSchema = z.object({
  user: UserSchema,
});

export type UserResponse = z.infer<typeof UserResponseSchema>;
