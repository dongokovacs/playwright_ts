import { z } from 'zod';

// Conduit's validation-error body (422): field name -> list of messages,
// e.g. { errors: { username: ['has already been taken'] } }.
export const ValidationErrorResponseSchema = z.object({
  errors: z.record(z.string(), z.array(z.string())),
});

export type ValidationErrorResponse = z.infer<typeof ValidationErrorResponseSchema>;
