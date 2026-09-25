import { z } from 'zod';
// object() passes even with unknown fields
export const AuthorSchema = z.object({
  username: z.string(),
  bio: z.string().nullable(),
  image: z.string().nullable(),
  following: z.boolean(),
});

// strictObject() reject unknown fields
export const ArticleSchema = z.strictObject({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  body: z.string(),
  tagList: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  favorited: z.boolean(),
  favoritesCount: z.number().int().nonnegative(),
  author: AuthorSchema,
});

export const ArticleResponseSchema = z.object({
  article: ArticleSchema,
});

export const ArticlesListResponseSchema = z.object({
  articles: z.array(ArticleSchema),
  articlesCount: z.number().int().nonnegative(),
});

/**
 * The create-article request body — what an AI-generated or faker-built
 * article must satisfy before it's sent. Note the API normalizes tagList on
 * write (lowercases and de-duplicates it), so assert rendered tags against
 * the *stored* article's tagList, not this payload's.
 */
export const CreateArticlePayloadSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(200),
  body: z.string().min(1),
  tagList: z.array(z.string().min(1)).min(1).max(5),
});

export type Article = z.infer<typeof ArticleSchema>;
export type ArticleResponse = z.infer<typeof ArticleResponseSchema>;
export type ArticlesListResponse = z.infer<typeof ArticlesListResponseSchema>;
export type CreateArticlePayload = z.infer<typeof CreateArticlePayloadSchema>;
