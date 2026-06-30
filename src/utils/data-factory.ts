import { faker } from '@faker-js/faker';
import type { CreateArticlePayload } from '../api/articles.client';

export function buildArticlePayload(
  overrides: Partial<CreateArticlePayload> = {},
): CreateArticlePayload {
  return {
    title: faker.lorem.sentence(4),
    description: faker.lorem.sentence(8),
    body: faker.lorem.paragraphs(2),
    tagList: [faker.word.noun(), faker.word.noun()],
    ...overrides,
  };
}
