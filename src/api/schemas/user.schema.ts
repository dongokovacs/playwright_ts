import { z } from 'zod';

// strictObject(): reject unknown fields, same contract-testing philosophy as ArticleSchema.
// `id` is optional because the live API isn't consistent about it: POST /users
// (register) returns it, POST /users/login doesn't. Strict + optional still
// fails on any field that isn't one of these.
export const UserSchema = z.strictObject({
  id: z.number().int().positive().optional(),
  email: z.email(),
  token: z.string().min(1),
  username: z.string().min(1),
  bio: z.string().nullable(),
  image: z.string().nullable(),
});

export const UserResponseSchema = z.object({
  user: UserSchema,
});

export type UserResponse = z.infer<typeof UserResponseSchema>;
