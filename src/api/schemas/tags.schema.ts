import { z } from 'zod';

export const TagsResponseSchema = z.object({
  tags: z.array(z.string()),
});

export type TagsResponse = z.infer<typeof TagsResponseSchema>;
